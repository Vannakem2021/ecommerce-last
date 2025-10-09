import mongoose from 'mongoose'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (global as any).mongoose || { conn: null, promise: null }

export const connectToDatabase = async (
  MONGODB_URI = process.env.MONGODB_URI
) => {
  if (cached.conn) {
    return cached.conn
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Please set it in environment variables.')
  }

  // Configure Mongoose for better Vercel/serverless performance
  mongoose.set('bufferCommands', false) // Disable buffering to fail fast
  mongoose.set('bufferTimeoutMS', 10000) // 10 second timeout

  // Connection options optimized for Vercel
  const options = {
    serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2, // Maintain at least 2 socket connections
  }

  try {
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, options)
    cached.conn = await cached.promise
    
    console.log('✅ MongoDB connected successfully')
    return cached.conn
  } catch (error) {
    cached.promise = null // Reset promise on failure
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}
