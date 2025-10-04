/**
 * Script to fix promotions with invalid/deleted creator references
 * 
 * Usage: npm run fix:promotions
 */

// Load environment variables using Next.js loader
import { loadEnvConfig } from '@next/env'
const projectDir = process.cwd()
loadEnvConfig(projectDir)

import { connectToDatabase } from '../lib/db'
import Promotion from '../lib/db/models/promotion.model'
import User from '../lib/db/models/user.model'
import mongoose from 'mongoose'

async function fixInvalidCreators() {
  try {
    console.log('🔧 Fixing promotions with invalid creators...\n')
    
    await connectToDatabase()
    console.log('✅ Connected to database\n')

    // Find the first admin user
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 })

    if (!adminUser) {
      console.log('❌ No admin user found. Please create at least one admin user first.')
      return
    }

    console.log(`👤 Using admin user: ${adminUser.name} (${adminUser.email})\n`)

    // Get all promotions
    const promotions = await Promotion.find().lean()
    
    let fixedCount = 0
    let validCount = 0

    for (const promo of promotions) {
      if (promo.createdBy) {
        // Check if the user exists
        const user = await User.findById(promo.createdBy)
        
        if (!user) {
          console.log(`🔧 Fixing: ${promo.code} - ${promo.name}`)
          console.log(`   Old creator ID: ${promo.createdBy}`)
          console.log(`   New creator: ${adminUser.name}`)
          
          await Promotion.findByIdAndUpdate(promo._id, {
            createdBy: new mongoose.Types.ObjectId(adminUser._id)
          })
          
          fixedCount++
        } else {
          validCount++
        }
      } else {
        console.log(`🔧 Fixing: ${promo.code} - ${promo.name} (no creator)`)
        console.log(`   Setting creator: ${adminUser.name}`)
        
        await Promotion.findByIdAndUpdate(promo._id, {
          createdBy: new mongoose.Types.ObjectId(adminUser._id)
        })
        
        fixedCount++
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ Fix completed!`)
    console.log(`   - Promotions with valid creator: ${validCount}`)
    console.log(`   - Promotions fixed: ${fixedCount}`)
    console.log(`   - All promotions now reference: ${adminUser.name}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  } catch (error) {
    console.error('❌ Fix failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the fix
fixInvalidCreators()
  .then(() => {
    console.log('🎉 Fix script finished successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Restart your development server')
    console.log('   2. Refresh the promotion detail page')
    console.log('   3. You should now see the staff member name\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fix script failed:', error)
    process.exit(1)
  })
