/**
 * Detailed diagnostic script to check promotion creator issues
 * 
 * Usage: npm run diagnose:promotions
 */

// Load environment variables using Next.js loader
import { loadEnvConfig } from '@next/env'
const projectDir = process.cwd()
loadEnvConfig(projectDir)

import { connectToDatabase } from '../lib/db'
import Promotion from '../lib/db/models/promotion.model'
import User from '../lib/db/models/user.model'
import mongoose from 'mongoose'

async function diagnosePromotions() {
  try {
    console.log('🔍 Diagnosing promotion creator issues...\n')
    
    await connectToDatabase()
    console.log('✅ Connected to database\n')

    // Get all promotions with raw data
    const promotions = await Promotion.find().lean()
    
    console.log(`📊 Total promotions: ${promotions.length}\n`)

    for (const promo of promotions) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Promotion: ${promo.code} - ${promo.name}`)
      console.log(`Created: ${promo.createdAt}`)
      console.log(`─────────────────────────────────────────`)
      console.log(`createdBy field:`)
      console.log(`  - Exists: ${promo.createdBy !== undefined}`)
      console.log(`  - Is null: ${promo.createdBy === null}`)
      console.log(`  - Type: ${typeof promo.createdBy}`)
      console.log(`  - Value: ${promo.createdBy}`)
      
      if (promo.createdBy) {
        // Check if the user exists
        const user = await User.findById(promo.createdBy)
        if (user) {
          console.log(`  ✅ User EXISTS in database`)
          console.log(`     - Name: ${user.name}`)
          console.log(`     - Email: ${user.email}`)
          console.log(`     - Role: ${user.role}`)
        } else {
          console.log(`  ❌ User DOES NOT EXIST (deleted or invalid ID)`)
        }

        // Try to populate
        const populatedPromo = await Promotion.findById(promo._id).populate('createdBy', 'name email')
        console.log(`\nPopulate test:`)
        if (populatedPromo && populatedPromo.createdBy) {
          console.log(`  - Type: ${typeof populatedPromo.createdBy}`)
          if (typeof populatedPromo.createdBy === 'object') {
            console.log(`  - Has name: ${!!(populatedPromo.createdBy as any).name}`)
            console.log(`  - Name value: ${(populatedPromo.createdBy as any).name || 'N/A'}`)
            console.log(`  - Has _id: ${!!(populatedPromo.createdBy as any)._id}`)
          } else {
            console.log(`  - Value: ${populatedPromo.createdBy}`)
          }
        } else {
          console.log(`  ❌ Populate FAILED`)
        }
      } else {
        console.log(`  ⚠️ createdBy is NULL or UNDEFINED`)
      }
      console.log('')
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the diagnosis
diagnosePromotions()
  .then(() => {
    console.log('✅ Diagnosis completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Diagnosis failed:', error)
    process.exit(1)
  })
