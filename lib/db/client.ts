// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from 'mongodb'
import { getSecureEnvVar, isProduction } from '../utils/environment'

// Validate MongoDB URI with enhanced security checks
const uri = getSecureEnvVar('MONGODB_URI', true)

// Additional security validation for production
if (isProduction() && uri && process.env.NODE_ENV !== 'test') {
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.warn('⚠️  WARNING: Using localhost MongoDB URI in production build mode')
    // throw new Error('❌ SECURITY ERROR: Production environment cannot use localhost MongoDB URI')
  }

  if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
    throw new Error('❌ SECURITY ERROR: Invalid MongoDB URI format')
  }

  if (uri.includes('test') || uri.includes('demo')) {
    console.warn('⚠️  WARNING: MongoDB URI contains test/demo patterns in production')
  }
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client: MongoClient

if (!isProduction()) {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
  }

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options)
  }
  client = globalWithMongo._mongoClient
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client
