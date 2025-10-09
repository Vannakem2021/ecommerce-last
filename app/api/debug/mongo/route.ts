import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

/**
 * DIAGNOSTIC ENDPOINT - Check MongoDB Connection
 * DELETE THIS FILE AFTER DEBUGGING
 */

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  }

  try {
    // Check 1: Environment variable exists
    const mongoUri = process.env.MONGODB_URI
    diagnostics.checks.envVariableExists = !!mongoUri
    
    if (!mongoUri) {
      diagnostics.checks.envVariableExists = false
      diagnostics.error = 'MONGODB_URI environment variable is not set'
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // Check 2: URI format (hide password)
    diagnostics.checks.uriFormat = mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')
    diagnostics.uriPreview = mongoUri.substring(0, 20) + '...[hidden]'
    
    // Check 3: Current mongoose connection state
    diagnostics.checks.mongooseState = mongoose.connection.readyState
    diagnostics.checks.mongooseStateDescription = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[mongoose.connection.readyState]

    // Check 4: Try to connect
    diagnostics.checks.connectionAttempted = true
    
    try {
      // Set aggressive timeouts for quick failure
      mongoose.set('bufferCommands', false)
      
      const startTime = Date.now()
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      })
      
      const connectionTime = Date.now() - startTime
      diagnostics.checks.connectionSuccess = true
      diagnostics.checks.connectionTimeMs = connectionTime
      
      // Check 5: Try a simple query
      const collections = await mongoose.connection.db.listCollections().toArray()
      diagnostics.checks.databaseQuerySuccess = true
      diagnostics.checks.collectionsFound = collections.length
      diagnostics.checks.collectionNames = collections.map(c => c.name)
      
      return NextResponse.json({
        ...diagnostics,
        status: 'SUCCESS',
        message: '✅ MongoDB connection working perfectly!'
      })
      
    } catch (connectionError: any) {
      diagnostics.checks.connectionSuccess = false
      diagnostics.checks.connectionError = connectionError.message
      diagnostics.checks.errorName = connectionError.name
      
      // Common error diagnostics
      if (connectionError.message.includes('ENOTFOUND')) {
        diagnostics.diagnosis = '❌ DNS Error: Cannot find MongoDB server. Check your MONGODB_URI hostname.'
      } else if (connectionError.message.includes('ETIMEDOUT') || connectionError.message.includes('timed out')) {
        diagnostics.diagnosis = '❌ Connection Timeout: MongoDB Atlas is blocking Vercel IPs. Add 0.0.0.0/0 to Network Access in MongoDB Atlas.'
      } else if (connectionError.message.includes('authentication failed')) {
        diagnostics.diagnosis = '❌ Authentication Error: Wrong username/password in MONGODB_URI.'
      } else if (connectionError.message.includes('buffering timed out')) {
        diagnostics.diagnosis = '❌ Buffering Timeout: Mongoose cannot connect to database. Check Network Access in MongoDB Atlas.'
      } else {
        diagnostics.diagnosis = '❌ Unknown connection error. See error details above.'
      }
      
      return NextResponse.json({
        ...diagnostics,
        status: 'FAILED',
        message: '❌ MongoDB connection failed'
      }, { status: 500 })
    }
    
  } catch (error: any) {
    diagnostics.error = error.message
    diagnostics.stack = error.stack
    
    return NextResponse.json({
      ...diagnostics,
      status: 'ERROR',
      message: '❌ Diagnostic check failed'
    }, { status: 500 })
  }
}
