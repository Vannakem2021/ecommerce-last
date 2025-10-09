import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import bcrypt from 'bcryptjs'

/**
 * One-Time Database Initialization Endpoint
 * 
 * This endpoint creates an initial admin user if the database is empty.
 * It's disabled after the first admin is created for security.
 * 
 * Security: Only works when database is completely empty
 */

const INIT_SECRET = process.env.INIT_SECRET

export async function POST(request: NextRequest) {
  try {
    // Get init secret from header
    const secretHeader = request.headers.get('x-init-secret')
    
    if (!INIT_SECRET || secretHeader !== INIT_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or missing initialization secret. Set INIT_SECRET environment variable.' 
        },
        { status: 403 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Check if any users exist
    const userCount = await User.countDocuments()
    
    if (userCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Database is not empty. This endpoint only works for initial setup.',
        hint: 'Use the /api/admin/seed endpoint instead (requires admin login)',
      }, { status: 400 })
    }

    // Get admin credentials from request
    const body = await request.json()
    const { email, password, name } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required',
        example: {
          email: 'admin@example.com',
          password: 'YourSecurePassword123!',
          name: 'Admin User'
        }
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Create admin user
    console.log('🔐 Creating initial admin user...')
    
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const adminUser = await User.create({
      name: name || 'Admin User',
      email: email,
      password: hashedPassword,
      role: 'Admin',
      emailVerified: true, // Auto-verify admin
    })

    console.log('✅ Admin user created successfully')

    return NextResponse.json({
      success: true,
      message: 'Initial admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
      nextSteps: [
        '1. Login with your credentials',
        '2. Run /api/admin/seed to populate database with sample data',
        '3. This endpoint is now disabled (database not empty)'
      ]
    })

  } catch (error: any) {
    console.error('❌ Initialization error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Initialization failed',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check initialization status
export async function GET() {
  try {
    await connectToDatabase()
    
    const userCount = await User.countDocuments()
    const adminCount = await User.countDocuments({ role: 'Admin' })

    return NextResponse.json({
      success: true,
      database: {
        isEmpty: userCount === 0,
        userCount,
        adminCount,
        needsInitialization: userCount === 0,
      },
      message: userCount === 0 
        ? 'Database is empty. You can create an initial admin user.'
        : `Database has ${userCount} users (${adminCount} admins). Initialization not needed.`
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
