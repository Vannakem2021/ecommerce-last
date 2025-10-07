"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { auth, signIn, signOut } from "@/auth";
import { IUserName, IUserSignIn, IUserSignUp, IAdminUserCreate, IForgotPassword, IResetPassword } from "@/types";
import {
  UserSignUpSchema,
  UserUpdateSchema,
  AdminUserCreateSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../validator";
import { connectToDatabase } from "../db";
import User, { IUser } from "../db/models/user.model";
import Order from "../db/models/order.model";
import PasswordResetToken from "../db/models/password-reset-token.model";
import { formatError } from "../utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSetting } from "./setting.actions";
import {
  requirePermission,
  canManageUser,
  validateRoleAssignment,
  getCurrentUserWithRole,
} from "../rbac";
import { normalizeRole, canUserRoleManageTargetRole } from "../rbac-utils";
import { sendPasswordResetEmail } from "../../emails";
import { generateEmailOTP } from "./email-verification.actions";
import { createNotificationForRoles } from "./notification.actions";

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email, // Email normalization happens in schema transform
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    });

    await connectToDatabase();

    // Create user with minimal required data for registration
    const newUser = await User.create({
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 12),
      role: "user", // Default role for new registrations
      emailVerified: false,
      // paymentMethod and address are optional during registration
    });
    // Generate and send OTP for email verification
    const otpResult = await generateEmailOTP(newUser._id.toString());

    if (!otpResult.success) {
      console.error('Failed to send verification OTP:', otpResult.error);
      // Don't fail registration if email sending fails
    }

    // Notify admins of new user registration
    try {
      await createNotificationForRoles({
        roles: ['admin'],
        type: 'user',
        title: 'New User Registration',
        message: `${newUser.name} (${newUser.email}) created an account`,
        data: { userId: newUser._id.toString(), email: newUser.email },
        link: `/admin/users/${newUser._id}`
      })
    } catch (error) {
      console.error('Failed to create user registration notification:', error)
    }

    return {
      success: true,
      message: "Account created. Please verify your email.",
      userId: newUser._id.toString(),
      requiresVerification: true,
    };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

// ADMIN CREATE USER
export async function createUserByAdmin(userInput: IAdminUserCreate) {
  try {
    // Check if current user has permission to create users
    await requirePermission("users.create");

    // Validate the input data
    const validatedData = AdminUserCreateSchema.parse(userInput);

    // Validate role assignment (user can only assign roles they can manage)
    await validateRoleAssignment(validatedData.role);

    await connectToDatabase();

    // Check if user with this email already exists (email is already normalized by schema)
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Prepare user data based on role
    const userData: any = {
      name: validatedData.name,
      email: validatedData.email,
      role: normalizeRole(validatedData.role),
      password: await bcrypt.hash(validatedData.password, 12),
      emailVerified: false,
    };

    // Only add customer-specific fields for customer users
    if (validatedData.role === "user") {
      userData.paymentMethod = validatedData.paymentMethod || "PayPal";
      userData.address = validatedData.address || {
        fullName: validatedData.name,
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "",
        phone: "",
      };
    } else {
      // For system users, only add these fields if explicitly provided
      if (validatedData.paymentMethod) {
        userData.paymentMethod = validatedData.paymentMethod;
      }
      if (validatedData.address) {
        userData.address = validatedData.address;
      }
    }

    // Create the new user
    const newUser = await User.create(userData);

    console.log('Created user in DB:', newUser._id)
    console.log('Returning user ID:', newUser._id.toString())

    revalidatePath("/admin/users");

    const response = {
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
    
    console.log('Server action response:', response)
    console.log('Response data.id:', response.data.id)
    
    return response;
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// DELETE

export async function deleteUser(id: string) {
  try {
    // Check if current user has permission to delete users
    await requirePermission("users.delete");

    await connectToDatabase();

    // Get the target user to check if current user can manage them
    const targetUser = await User.findById(id);
    if (!targetUser) throw new Error("User not found");

    // Prevent users from deleting users with higher or equal hierarchy
    const canManage = await canManageUser(targetUser.role);
    if (!canManage) {
      throw new Error("Cannot delete user with equal or higher privileges");
    }

    // Prevent self-deletion
    const currentUser = await getCurrentUserWithRole();
    if (currentUser.id === id) {
      throw new Error("Cannot delete your own account");
    }

    const res = await User.findByIdAndDelete(id);
    if (!res) throw new Error("User not found");

    revalidatePath("/admin/users");
    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
// UPDATE

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    // Check if current user has permission to update users
    await requirePermission("users.update");

    await connectToDatabase();

    // Get the target user
    const dbUser = await User.findById(user._id);
    if (!dbUser) throw new Error("User not found");

    // Check if current user can manage the target user
    const canManage = await canManageUser(dbUser.role);
    if (!canManage) {
      throw new Error("Cannot update user with equal or higher privileges");
    }

    // If role is being changed, validate the new role assignment
    if (user.role !== dbUser.role) {
      await validateRoleAssignment(user.role);

      // Additional check: prevent users from elevating others above their own level
      const canManageNewRole = await canManageUser(user.role);
      if (!canManageNewRole) {
        throw new Error("Cannot assign role with equal or higher privileges");
      }
    }

    // Prevent users from changing their own role (to prevent privilege escalation)
    const currentUser = await getCurrentUserWithRole();
    if (currentUser.id === user._id && user.role !== dbUser.role) {
      throw new Error("Cannot change your own role");
    }

    // Update user data
    dbUser.name = user.name;
    dbUser.email = user.email;
    dbUser.role = normalizeRole(user.role);

    const updatedUser = await dbUser.save();
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User updated successfully",
      data: JSON.parse(JSON.stringify(updatedUser)),
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
export async function updateUserName(user: IUserName) {
  try {
    await connectToDatabase();
    const session = await auth();
    const currentUser = await User.findById(session?.user?.id);
    if (!currentUser) throw new Error("User not found");
    currentUser.name = user.name;
    const updatedUser = await currentUser.save();
    return {
      success: true,
      message: "User updated successfully",
      data: JSON.parse(JSON.stringify(updatedUser)),
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn("credentials", { ...user, redirect: false });
}
export const SignInWithGoogle = async () => {
  await signIn("google");
};
export const SignOut = async () => {
  // Use NextAuth v5 signOut with proper URL handling
  const result = await signOut({
    redirect: false,
    redirectTo: "/" // Specify the redirect URL
  });

  // In NextAuth v5, signOut with redirect: false returns { url: string }
  redirect(result.url);
};

// PASSWORD RESET FUNCTIONS
export async function requestPasswordReset(forgotPasswordData: IForgotPassword) {
  try {
    const { email } = await ForgotPasswordSchema.parseAsync(forgotPasswordData);

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create new reset token
    await PasswordResetToken.create({
      userId: user._id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      resetToken,
      userEmail: user.email,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Don't fail the request if email sending fails
    }

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

export async function validateResetToken(token: string) {
  try {
    await connectToDatabase();

    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    return { success: true, userId: resetToken.userId };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

export async function resetPassword(resetPasswordData: IResetPassword) {
  try {
    const { token, password } = await ResetPasswordSchema.parseAsync(resetPasswordData);

    await connectToDatabase();

    // Find and validate the reset token
    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    // Find the user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update user password
    user.password = await bcrypt.hash(password, 12);
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    return {
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password."
    };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

// GET
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number;
  page: number;
}) {
  // Check if current user has permission to read users
  await requirePermission("users.read");

  const {
    common: { pageSize },
  } = await getSetting();
  limit = limit || pageSize;
  await connectToDatabase();

  const skipAmount = (Number(page) - 1) * limit;
  const users = await User.find()
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(limit);
  const usersCount = await User.countDocuments();
  return {
    data: JSON.parse(JSON.stringify(users)) as IUser[],
    totalPages: Math.ceil(usersCount / limit),
  };
}

// GET USERS WITH PERMISSIONS (Server-side permission filtering)
export async function getAllUsersWithPermissions({
  limit,
  page,
}: {
  limit?: number;
  page: number;
}) {
  // Check if current user has permission to read users
  await requirePermission("users.read");

  const currentUser = await getCurrentUserWithRole();
  const {
    common: { pageSize },
  } = await getSetting();
  limit = limit || pageSize;
  await connectToDatabase();

  const skipAmount = (Number(page) - 1) * limit;
  const users = await User.find()
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(limit);
  const usersCount = await User.countDocuments();

  // Enrich users with order statistics
  const userIds = users.map(user => user._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);

  // Create a map for quick lookup
  const orderStatsMap = new Map(
    orderStats.map(stat => [stat._id.toString(), stat])
  );

  // Add permission flags to each user based on current user's permissions
  // Use the more efficient version that doesn't call auth() per user
  const usersWithPermissions = users.map((user) => {
    const userObj = JSON.parse(JSON.stringify(user)) as IUser;
    const stats = orderStatsMap.get(user._id.toString());

    // Check if current user can manage this user using role comparison
    const canManageThisUser = canUserRoleManageTargetRole(currentUser.role, user.role);

    return {
      ...userObj,
      canEdit: canManageThisUser,
      canDelete: canManageThisUser && currentUser.id !== user._id.toString(),
      totalOrders: stats?.totalOrders || 0,
      lastOrderDate: stats?.lastOrderDate || null,
    };
  });

  // Check current user's permissions for UI controls
  const { hasPermission } = await import('../rbac-utils');
  const permissions = {
    canCreate: hasPermission(currentUser.role, 'users.create'),
    canUpdate: hasPermission(currentUser.role, 'users.update'),
    canDelete: hasPermission(currentUser.role, 'users.delete'),
  };

  return {
    data: usersWithPermissions,
    totalPages: Math.ceil(usersCount / limit),
    permissions,
  };
}

export async function getUserById(userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Allow users to access their own data without permission check
  if (session.user.id === userId) {
    return JSON.parse(JSON.stringify(user)) as IUser;
  }

  // For accessing other users' data, check permissions
  await requirePermission("users.read");

  // Check if current user can view this user (hierarchy check)
  const canManage = await canManageUser(user.role);
  if (!canManage) {
    throw new Error("Cannot view user with equal or higher privileges");
  }

  return JSON.parse(JSON.stringify(user)) as IUser;
}

// UPDATE USER ADDRESS
export async function updateUserAddress(userId: string, address: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // 1. Validate userId format (prevent NoSQL injection)
    if (!userId || typeof userId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error("Invalid user ID format");
    }

    // 2. Authorization check
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager';
    const isOwner = session.user.id === userId;

    if (!isAdmin && !isOwner) {
      console.warn(`[SECURITY] Unauthorized address update attempt: User ${session.user.id} (role: ${session.user.role}) tried to update ${userId}`);
      throw new Error("Unauthorized: Cannot update another user's address");
    }

    // 3. Validate and sanitize address data using ShippingAddressSchema
    const { ShippingAddressSchema } = await import('../validator');
    const validatedAddress = ShippingAddressSchema.parse(address);

    await connectToDatabase();

    // 4. Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // 5. Update only the address field (use $set to prevent field injection)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { address: validatedAddress } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update address");
    }

    // 6. Audit log
    console.log(`[AUDIT] Address updated for user ${userId} by ${session.user.id} (role: ${session.user.role})`);

    revalidatePath("/account/addresses");
    return { success: true, data: updatedUser.address };
  } catch (error) {
    console.error(`[ERROR] Address update failed for user ${userId}:`, error);

    // Handle Zod validation errors specifically
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string }> };
      return {
        success: false,
        error: "Invalid address data: " + zodError.issues.map(e => e.message).join(", ")
      };
    }

    return { success: false, error: formatError(error) };
  }
}

// Get customer statistics including top customer
export async function getCustomerStatistics() {
  try {
    await requirePermission('users.read');
    await connectToDatabase();

    // Aggregate orders by customer to find top customer
    // Only include customers (role='user'), exclude system users
    const topCustomerData = await Order.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $match: {
          'userInfo.role': 'user' // Only count orders from actual customers
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          userName: { $first: '$userInfo.name' },
          userEmail: { $first: '$userInfo.email' }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $limit: 1
      }
    ]);

    if (topCustomerData.length > 0) {
      const topCustomer = topCustomerData[0];
      return {
        success: true,
        data: {
          name: topCustomer.userName || 'Unknown',
          email: topCustomer.userEmail || '',
          orderCount: topCustomer.orderCount || 0,
          totalSpent: topCustomer.totalSpent || 0
        }
      };
    }

    return {
      success: true,
      data: null
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error),
      data: null
    };
  }
}

// Get users for export
export async function getUsersForExport(userType: 'customer' | 'system') {
  try {
    await connectToDatabase()

    const roleFilter = userType === 'customer' 
      ? { role: 'user' } 
      : { role: { $in: ['admin', 'manager', 'seller'] } }

    const users = await User.find(roleFilter)
      .select('name email phone role isActive emailVerified createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .lean()

    // Get order statistics for all users
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ])

    // Create lookup map for O(1) access
    const statsMap = new Map(
      orderStats.map(stat => [stat._id.toString(), stat])
    )

    // Enrich user data with order statistics
    const enrichedUsers = users.map(user => {
      const stats = statsMap.get(user._id.toString())
      return {
        ...user,
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalSpent || 0,
        lastOrderDate: stats?.lastOrderDate || null
      }
    })

    return {
      success: true,
      data: enrichedUsers
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      data: []
    }
  }
}

// UPDATE USER PROFILE IMAGE
export async function updateUserImage(image: string) {
  try {
    // 1. Validate input
    const { UserImageUpdateSchema } = await import('../validator');
    const validatedData = UserImageUpdateSchema.parse({ image });
    
    // 2. Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // 3. Connect to database
    await connectToDatabase();

    // 4. Find and update user
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // 5. Update image field
    user.image = validatedData.image;
    await user.save();

    // 6. Revalidate cache
    revalidatePath("/account");
    revalidatePath("/account/manage");

    return {
      success: true,
      message: "Profile picture updated successfully",
      data: user.image,
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    };
  }
}

// REMOVE USER PROFILE IMAGE
export async function removeUserImage() {
  try {
    // 1. Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // 2. Connect to database
    await connectToDatabase();

    // 3. Find and update user
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // 4. Remove image field
    user.image = undefined;
    await user.save();

    // 5. Revalidate cache
    revalidatePath("/account");
    revalidatePath("/account/manage");

    return {
      success: true,
      message: "Profile picture removed successfully",
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    };
  }
}

// GET USER AUTH METHOD (Check if user has password)
export async function getUserAuthMethod(userId: string) {
  try {
    await connectToDatabase()
    const user = await User.findById(userId).select('password email')
    
    if (!user) {
      throw new Error('User not found')
    }

    return {
      success: true,
      data: {
        hasPassword: !!user.password,
        email: user.email,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error)
    }
  }
}

// CHANGE PASSWORD (for users who already have a password)
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    await connectToDatabase()

    const user = await User.findById(session.user.id)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify user has a password
    if (!user.password) {
      throw new Error('No password set. Please use "Set Password" instead.')
    }

    // Verify current password
    const isMatch = await bcrypt.compare(data.currentPassword, user.password)
    if (!isMatch) {
      throw new Error('Current password is incorrect')
    }

    // Hash and update new password
    user.password = await bcrypt.hash(data.newPassword, 12)
    await user.save()

    revalidatePath('/account/manage')

    // TODO: Send email notification
    // await sendPasswordChangeEmail(user.email, user.name)

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

// SET PASSWORD (for OAuth users who don't have a password)
export async function setPassword(data: {
  password: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    await connectToDatabase()

    const user = await User.findById(session.user.id)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user already has a password
    if (user.password) {
      throw new Error('Password already set. Use "Change Password" instead.')
    }

    // Hash and set password
    user.password = await bcrypt.hash(data.password, 12)
    await user.save()

    revalidatePath('/account/manage')

    // TODO: Send email notification
    // await sendPasswordSetEmail(user.email, user.name)

    return {
      success: true,
      message: 'Password set successfully! You can now sign in with email/password.',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

// SET DEFAULT ADDRESS
export async function setDefaultAddress(address: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Validate address data
    const { ShippingAddressSchema } = await import('../validator');
    const validatedAddress = ShippingAddressSchema.parse(address);

    await connectToDatabase();

    // Update user's default address
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { address: validatedAddress } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to set default address");
    }

    revalidatePath("/account/addresses");
    return { success: true, message: "Default address set successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// UPDATE PHONE NUMBER
export async function updatePhoneNumber(phone: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Basic phone validation
    if (phone && phone.trim().length < 8) {
      throw new Error("Invalid phone number");
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { phone: phone.trim() } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update phone number");
    }

    revalidatePath("/account/manage");
    return { success: true, message: "Phone number updated successfully", data: { phone: updatedUser.phone } };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// UPDATE LANGUAGE PREFERENCE
export async function updateLanguagePreference(language: 'en-US' | 'kh') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!['en-US', 'kh'].includes(language)) {
      throw new Error("Invalid language");
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { preferredLanguage: language } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update language preference");
    }

    revalidatePath("/account/manage");
    return { success: true, message: "Language updated successfully", data: { preferredLanguage: updatedUser.preferredLanguage } };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// UPDATE CURRENCY PREFERENCE
export async function updateCurrencyPreference(currency: 'USD' | 'KHR') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!['USD', 'KHR'].includes(currency)) {
      throw new Error("Invalid currency");
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { preferredCurrency: currency } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update currency preference");
    }

    revalidatePath("/account/manage");
    return { success: true, message: "Currency updated successfully", data: { preferredCurrency: updatedUser.preferredCurrency } };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// UPDATE PROFILE IMAGE
export async function updateProfileImage(imageUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!imageUrl || !imageUrl.trim()) {
      throw new Error("Invalid image URL");
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { image: imageUrl.trim() } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update profile image");
    }

    revalidatePath("/account/manage");
    revalidatePath("/account");
    return { success: true, message: "Profile picture updated successfully", data: { image: updatedUser.image } };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// REMOVE PROFILE IMAGE
export async function removeProfileImage() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $unset: { image: "" } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to remove profile image");
    }

    revalidatePath("/account/manage");
    revalidatePath("/account");
    return { success: true, message: "Profile picture removed successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// DELETE MY ACCOUNT (self-delete)
export async function deleteMyAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    await connectToDatabase();

    // Get user data for verification
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent admin/manager accounts from self-deleting
    if (user.role === 'admin' || user.role === 'manager') {
      throw new Error("Admin and Manager accounts cannot be self-deleted. Please contact support.");
    }

    // Delete user account
    await User.findByIdAndDelete(session.user.id);

    // Optional: Delete related data (orders, reviews, etc.)
    // Note: You might want to keep orders for business records
    // await Order.updateMany({ user: session.user.id }, { $set: { user: null, userName: user.name } });
    // await Review.deleteMany({ user: session.user.id });

    return { 
      success: true, 
      message: "Account deleted successfully. You will be signed out." 
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    };
  }
}
