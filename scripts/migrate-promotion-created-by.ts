/**
 * Migration script to add createdBy field to existing promotions
 * Run this script once to update legacy promotions
 * 
 * Usage: npm run migrate:promotions
 */

// Load environment variables using Next.js loader
import { loadEnvConfig } from '@next/env'
const projectDir = process.cwd()
loadEnvConfig(projectDir)

import { connectToDatabase } from '../lib/db'
import Promotion from '../lib/db/models/promotion.model'
import User from '../lib/db/models/user.model'
import mongoose from 'mongoose'

async function migratePromotions() {
  try {
    console.log('🔄 Starting promotion migration...')
    
    await connectToDatabase()
    console.log('✅ Connected to database')

    // Find all promotions without createdBy field
    const promotionsWithoutCreator = await Promotion.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    })

    console.log(`📊 Found ${promotionsWithoutCreator.length} promotions without creator`)

    if (promotionsWithoutCreator.length === 0) {
      console.log('✨ All promotions already have creator information!')
      return
    }

    // Find the first admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 })

    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating a system admin reference...')
      // You can either create a system user or skip the migration
      console.log('❌ Please create at least one admin user first, then run this migration.')
      return
    }

    console.log(`👤 Using admin user: ${adminUser.name} (${adminUser.email}) as default creator`)

    // Update all promotions
    const result = await Promotion.updateMany(
      {
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null }
        ]
      },
      {
        $set: { createdBy: new mongoose.Types.ObjectId(adminUser._id) }
      }
    )

    console.log(`✅ Migration completed successfully!`)
    console.log(`   - Promotions updated: ${result.modifiedCount}`)
    console.log(`   - All promotions now have creator: ${adminUser.name}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Close the connection
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
migratePromotions()
  .then(() => {
    console.log('🎉 Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  })
