import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import bcrypt from 'bcryptjs'

/**
 * TEMPORARY ADMIN CREATION ENDPOINT
 * 
 * ⚠️ WARNING: This is a one-time setup endpoint
 * ⚠️ DELETE THIS FILE AFTER CREATING YOUR ADMIN
 * ⚠️ Only works when database is empty
 */

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    // Security: Only allow if no users exist
    const userCount = await User.countDocuments()
    
    if (userCount > 0) {
      return NextResponse.json({
        success: false,
        message: '❌ Database already has users. Delete this file for security.',
        userCount,
      }, { status: 400 })
    }

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password required'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters'
      }, { status: 400 })
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const admin = await User.create({
      name: name || 'Admin',
      email,
      password: hashedPassword,
      role: 'Admin',
      emailVerified: true,
    })

    return NextResponse.json({
      success: true,
      message: '✅ Admin created! Now DELETE this file: app/api/create-admin-temp/route.ts',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      warning: '⚠️ DELETE app/api/create-admin-temp/ folder NOW for security!'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
