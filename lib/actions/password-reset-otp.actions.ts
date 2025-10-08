"use server";

import bcrypt from "bcryptjs";
import { connectToDatabase } from "../db";
import User from "../db/models/user.model";
import OTP from "../db/models/otp.model";
import { formatError } from "../utils";
import { sendPasswordResetOTP } from "../../emails";

// Helper function to check rate limit (in-memory for now)
const otpGenerationMap = new Map<string, { count: number; resetAt: number }>();

function checkOTPGenerationRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const key = `pwd-otp-gen:${userId}`;
  const record = otpGenerationMap.get(key);

  if (!record || now > record.resetAt) {
    // Reset window (1 hour)
    otpGenerationMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { allowed: true, remaining: 4, resetIn: 3600 };
  }

  if (record.count >= 5) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: 5 - record.count,
    resetIn: Math.ceil((record.resetAt - now) / 1000),
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpGenerationMap.entries()) {
    if (now > record.resetAt) {
      otpGenerationMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * Generate and send OTP for password reset
 */
export async function generatePasswordResetOTP(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
}> {
  try {
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: "If an account with that email exists, a verification code has been sent.",
      };
    }

    const userId = user._id.toString();

    // Check rate limit
    const rateLimit = checkOTPGenerationRateLimit(userId);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many password reset requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`,
      };
    }

    // Delete any existing OTPs for this user and purpose
    await OTP.deleteMany({ userId, purpose: 'password-reset' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP with bcrypt (4 rounds for speed, still secure for short-lived tokens)
    const otpHash = await bcrypt.hash(otp, 4);

    // Set expiration time (15 minutes from now - longer for password reset)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Create new OTP record
    await OTP.create({
      userId,
      purpose: 'password-reset',
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Check if in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    const devMode = process.env.EMAIL_VERIFICATION_DEV_MODE === 'true';

    if (isDevelopment && devMode) {
      // Development mode: Log OTP to console instead of sending email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔒 PASSWORD RESET OTP (Development Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires in: 15 minutes`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        message: "Verification code generated (check server console in dev mode)",
        userId,
      };
    }

    // Production mode: Send email with OTP
    const emailResult = await sendPasswordResetOTP({
      otp,
      userEmail: user.email,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset OTP email:", emailResult.error);
      
      // In development, still return success so flow continues
      if (isDevelopment) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Email sending failed, showing OTP for development:');
        console.log(`OTP: ${otp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return {
          success: true,
          message: "Verification code generated (email failed, check server console)",
          userId,
        };
      }
      
      // In production, fail the request if email can't be sent
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      };
    }

    return {
      success: true,
      message: "If an account with that email exists, a verification code has been sent.",
      userId,
    };
  } catch (error) {
    console.error("Error generating password reset OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Verify OTP and reset password
 */
export async function verifyPasswordResetOTP(
  userId: string,
  otp: string,
  newPassword: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: "Invalid code format. Please enter 6 digits." };
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    await connectToDatabase();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Find active OTP record for password reset
    const otpRecord = await OTP.findOne({
      userId,
      purpose: 'password-reset',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        success: false,
        error: "Invalid or expired code. Please request a new one.",
      };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 5) {
      // Delete the OTP record
      await OTP.deleteOne({ _id: otpRecord._id });
      return {
        success: false,
        error: "Maximum attempts exceeded. Please request a new code.",
      };
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP using bcrypt
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      const remainingAttempts = 5 - otpRecord.attempts;
      return {
        success: false,
        error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
      };
    }

    // OTP is valid - update user password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return {
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Error verifying password reset OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Resend password reset OTP with cooldown
 */
export async function resendPasswordResetOTP(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  cooldownRemaining?: number;
}> {
  try {
    await connectToDatabase();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Find last OTP creation time for password reset
    const lastOTP = await OTP.findOne({ 
      userId, 
      purpose: 'password-reset' 
    }).sort({
      createdAt: -1,
    });

    if (lastOTP) {
      const timeSinceCreation = Date.now() - lastOTP.createdAt.getTime();
      const cooldownPeriod = 60 * 1000; // 60 seconds

      if (timeSinceCreation < cooldownPeriod) {
        const remainingSeconds = Math.ceil(
          (cooldownPeriod - timeSinceCreation) / 1000
        );
        return {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
          cooldownRemaining: remainingSeconds,
        };
      }
    }

    // Generate new OTP by calling the email-based function
    return await generatePasswordResetOTP(user.email);
  } catch (error) {
    console.error("Error resending password reset OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Check password reset OTP status
 */
export async function checkPasswordResetOTPStatus(userId: string): Promise<{
  hasActiveOTP: boolean;
  attemptsRemaining?: number;
  expiresIn?: number;
}> {
  try {
    await connectToDatabase();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return {
        hasActiveOTP: false,
      };
    }

    // Check for active OTP for password reset
    const otpRecord = await OTP.findOne({
      userId,
      purpose: 'password-reset',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        hasActiveOTP: false,
      };
    }

    const expiresIn = Math.ceil(
      (otpRecord.expiresAt.getTime() - Date.now()) / 1000
    );
    const attemptsRemaining = 5 - otpRecord.attempts;

    return {
      hasActiveOTP: true,
      attemptsRemaining,
      expiresIn,
    };
  } catch (error) {
    console.error("Error checking password reset OTP status:", error);
    return {
      hasActiveOTP: false,
    };
  }
}
