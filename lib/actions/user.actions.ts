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
import { normalizeRole } from "../rbac-utils";
import { sendPasswordResetEmail } from "../../emails";

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
    await User.create({
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 5),
      role: "user", // Default role for new registrations
      emailVerified: false,
      // paymentMethod and address are optional during registration
    });
    return { success: true, message: "User created successfully" };
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
      password: await bcrypt.hash(validatedData.password, 5),
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

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
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
  const redirectTo = await signOut({ redirect: false });
  redirect(redirectTo.redirect);
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
    user.password = await bcrypt.hash(password, 5);
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
export async function updateUserAddress(userId: string, address: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Users can only update their own address, or admins can update any address
    if (session.user.id !== userId && session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      { address },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
