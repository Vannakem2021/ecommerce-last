'use server'

import bcrypt from 'bcryptjs'
import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp, IAdminUserCreate } from '@/types'
import { UserSignUpSchema, UserUpdateSchema, AdminUserCreateSchema } from '../validator'
import { connectToDatabase } from '../db'
import User, { IUser } from '../db/models/user.model'
import { formatError } from '../utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import {
  requirePermission,
  canManageUser,
  validateRoleAssignment,
  getCurrentUserWithRole
} from '../rbac'
import { normalizeRole } from '../rbac-utils'

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email, // Email normalization happens in schema transform
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await connectToDatabase()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })
    return { success: true, message: 'User created successfully' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}

// ADMIN CREATE USER
export async function createUserByAdmin(userData: IAdminUserCreate) {
  try {
    // Check if current user has permission to create users
    await requirePermission('users.create')

    // Validate the input data
    const validatedData = AdminUserCreateSchema.parse(userData)

    // Validate role assignment (user can only assign roles they can manage)
    await validateRoleAssignment(validatedData.role)

    await connectToDatabase()

    // Check if user with this email already exists (email is already normalized by schema)
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create the new user
    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      role: normalizeRole(validatedData.role),
      password: await bcrypt.hash(validatedData.password, 5),
      emailVerified: false,
      // Set minimal required fields for admin-created users
      paymentMethod: 'PayPal', // Default payment method
      address: {
        fullName: validatedData.name,
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        phone: ''
      }
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE

export async function deleteUser(id: string) {
  try {
    // Check if current user has permission to delete users
    await requirePermission('users.delete')

    await connectToDatabase()

    // Get the target user to check if current user can manage them
    const targetUser = await User.findById(id)
    if (!targetUser) throw new Error('User not found')

    // Prevent users from deleting users with higher or equal hierarchy
    const canManage = await canManageUser(targetUser.role)
    if (!canManage) {
      throw new Error('Cannot delete user with equal or higher privileges')
    }

    // Prevent self-deletion
    const currentUser = await getCurrentUserWithRole()
    if (currentUser.id === id) {
      throw new Error('Cannot delete your own account')
    }

    const res = await User.findByIdAndDelete(id)
    if (!res) throw new Error('User not found')

    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// UPDATE

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    // Check if current user has permission to update users
    await requirePermission('users.update')

    await connectToDatabase()

    // Get the target user
    const dbUser = await User.findById(user._id)
    if (!dbUser) throw new Error('User not found')

    // Check if current user can manage the target user
    const canManage = await canManageUser(dbUser.role)
    if (!canManage) {
      throw new Error('Cannot update user with equal or higher privileges')
    }

    // If role is being changed, validate the new role assignment
    if (user.role !== dbUser.role) {
      await validateRoleAssignment(user.role)

      // Additional check: prevent users from elevating others above their own level
      const canManageNewRole = await canManageUser(user.role)
      if (!canManageNewRole) {
        throw new Error('Cannot assign role with equal or higher privileges')
      }
    }

    // Prevent users from changing their own role (to prevent privilege escalation)
    const currentUser = await getCurrentUserWithRole()
    if (currentUser.id === user._id && user.role !== dbUser.role) {
      throw new Error('Cannot change your own role')
    }

    // Update user data
    dbUser.name = user.name
    dbUser.email = user.email
    dbUser.role = normalizeRole(user.role)

    const updatedUser = await dbUser.save()
    revalidatePath('/admin/users')

    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
export async function updateUserName(user: IUserName) {
  try {
    await connectToDatabase()
    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')
    currentUser.name = user.name
    const updatedUser = await currentUser.save()
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', { ...user, redirect: false })
}
export const SignInWithGoogle = async () => {
  await signIn('google')
}
export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

// GET
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  // Check if current user has permission to read users
  await requirePermission('users.read')

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit
  const users = await User.find()
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const usersCount = await User.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(users)) as IUser[],
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  // Check if current user has permission to read users
  await requirePermission('users.read')

  await connectToDatabase()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  // Check if current user can view this user (hierarchy check)
  const canManage = await canManageUser(user.role)
  if (!canManage) {
    throw new Error('Cannot view user with equal or higher privileges')
  }

  return JSON.parse(JSON.stringify(user)) as IUser
}
