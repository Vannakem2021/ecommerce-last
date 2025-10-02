"use server";

import bcrypt from "bcryptjs";
import { connectToDatabase } from "../db";
import User from "../db/models/user.model";
import EmailVerificationOTP from "../db/models/email-verification-otp.model";
import { formatError } from "../utils";
import { sendEmailVerificationOTP } from "../../emails";

// Helper function to check rate limit (in-memory for now)
const otpGenerationMap = new Map<string, { count: number; resetAt: number }>();

function checkOTPGenerationRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const key = `otp-gen:${userId}`;
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
 * Generate and send OTP for email verification
 */
export async function generateEmailOTP(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await connectToDatabase();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email is already verified",
      };
    }

    // Check rate limit
    const rateLimit = checkOTPGenerationRateLimit(userId);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many OTP requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`,
      };
    }

    // Delete any existing OTPs for this user
    await EmailVerificationOTP.deleteMany({ userId });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP with bcrypt (4 rounds for speed, still secure for short-lived tokens)
    const otpHash = await bcrypt.hash(otp, 4);

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create new OTP record
    await EmailVerificationOTP.create({
      userId,
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
      console.log('📧 EMAIL VERIFICATION OTP (Development Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires in: 10 minutes`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        message: "Verification code generated (check server console in dev mode)",
      };
    }

    // Production mode: Send email with OTP
    const emailResult = await sendEmailVerificationOTP({
      otp,
      userEmail: user.email,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error("Failed to send verification OTP email:", emailResult.error);
      
      // In development, still return success so flow continues
      if (isDevelopment) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Email sending failed, showing OTP for development:');
        console.log(`OTP: ${otp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return {
          success: true,
          message: "Verification code generated (email failed, check server console)",
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
      message: "Verification code sent to your email",
    };
  } catch (error) {
    console.error("Error generating email OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Verify OTP for email verification
 */
export async function verifyEmailOTP(
  userId: string,
  otp: string
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

    await connectToDatabase();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email is already verified",
      };
    }

    // Find active OTP record
    const otpRecord = await EmailVerificationOTP.findOne({
      userId,
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
      await EmailVerificationOTP.deleteOne({ _id: otpRecord._id });
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

    // OTP is valid - update user
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Mark OTP as verified and delete it
    await EmailVerificationOTP.deleteOne({ _id: otpRecord._id });

    return {
      success: true,
      message: "Email verified successfully!",
    };
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Resend OTP with cooldown
 */
export async function resendEmailOTP(userId: string): Promise<{
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

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email is already verified",
      };
    }

    // Find last OTP creation time
    const lastOTP = await EmailVerificationOTP.findOne({ userId }).sort({
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

    // Generate new OTP
    return await generateEmailOTP(userId);
  } catch (error) {
    console.error("Error resending email OTP:", error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Check email verification status
 */
export async function checkEmailVerificationStatus(userId: string): Promise<{
  verified: boolean;
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
        verified: false,
        hasActiveOTP: false,
      };
    }

    // Check if verified
    if (user.emailVerified) {
      return {
        verified: true,
        hasActiveOTP: false,
      };
    }

    // Check for active OTP
    const otpRecord = await EmailVerificationOTP.findOne({
      userId,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        verified: false,
        hasActiveOTP: false,
      };
    }

    const expiresIn = Math.ceil(
      (otpRecord.expiresAt.getTime() - Date.now()) / 1000
    );
    const attemptsRemaining = 5 - otpRecord.attempts;

    return {
      verified: false,
      hasActiveOTP: true,
      attemptsRemaining,
      expiresIn,
    };
  } catch (error) {
    console.error("Error checking email verification status:", error);
    return {
      verified: false,
      hasActiveOTP: false,
    };
  }
}
