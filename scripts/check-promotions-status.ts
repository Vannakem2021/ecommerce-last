/**
 * Script to check the current status of promotions createdBy field
 * 
 * Usage: npm run check:promotions
 */

// Load environment variables using Next.js loader
import { loadEnvConfig } from '@next/env'
const projectDir = process.cwd()
loadEnvConfig(projectDir)

import { connectToDatabase } from '../lib/db'
import Promotion from '../lib/db/models/promotion.model'
import User from '../lib/db/models/user.model'
import mongoose from 'mongoose'

async function checkPromotions() {
  try {
    console.log('🔍 Checking promotions status...\n')
    
    await connectToDatabase()
    console.log('✅ Connected to database\n')

    // Get total promotions
    const totalPromotions = await Promotion.countDocuments()
    console.log(`📊 Total promotions: ${totalPromotions}\n`)

    // Check promotions with createdBy
    const withCreator = await Promotion.countDocuments({
      createdBy: { $exists: true, $ne: null }
    })
    console.log(`✅ Promotions with creator: ${withCreator}`)

    // Check promotions without createdBy
    const withoutCreator = await Promotion.countDocuments({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    })
    console.log(`❌ Promotions without creator: ${withoutCreator}\n`)

    if (withoutCreator > 0) {
      console.log('📝 Promotions without creator:')
      const promotionsWithoutCreator = await Promotion.find({
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null }
        ]
      }).select('code name createdAt')

      promotionsWithoutCreator.forEach((promo, index) => {
        console.log(`   ${index + 1}. ${promo.code} - ${promo.name} (Created: ${promo.createdAt})`)
      })
      console.log('')
    }

    // Check admin users available
    const adminUsers = await User.find({ role: 'admin' }).select('name email')
    console.log(`👤 Available admin users: ${adminUsers.length}`)
    if (adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`)
      })
    }
    console.log('')

    // Recommendation
    if (withoutCreator > 0) {
      console.log('💡 Recommendation: Run migration to fix promotions without creator')
      console.log('   Command: npm run migrate:promotions\n')
    } else {
      console.log('✨ All promotions have creator information!\n')
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the check
checkPromotions()
  .then(() => {
    console.log('✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Check failed:', error)
    process.exit(1)
  })
