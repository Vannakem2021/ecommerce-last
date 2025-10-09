/**
 * Cleanup Script: Remove Duplicate Addresses
 * 
 * This script removes duplicate addresses from user accounts and ensures
 * only one address is marked as default.
 * 
 * Run with: npx tsx scripts/cleanup-duplicate-addresses.ts
 */

import { connectToDatabase } from '../lib/db'
import User from '../lib/db/models/user.model'

async function cleanupDuplicateAddresses() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    const users = await User.find({ addresses: { $exists: true, $ne: [] } })
    console.log(`Found ${users.length} users with addresses`)

    let totalCleaned = 0
    let totalDefaultsFixed = 0

    for (const user of users) {
      let addressesChanged = false
      const addresses = user.addresses || []
      
      if (addresses.length === 0) continue

      // Remove duplicates based on matching all fields
      const uniqueAddresses = []
      const seen = new Set()

      for (const addr of addresses) {
        // Create a unique key based on address fields (excluding _id, createdAt, updatedAt)
        const key = JSON.stringify({
          fullName: addr.fullName,
          phone: addr.phone,
          provinceId: addr.provinceId,
          districtId: addr.districtId,
          communeCode: addr.communeCode,
          houseNumber: addr.houseNumber,
          street: addr.street,
          postalCode: addr.postalCode,
        })

        if (!seen.has(key)) {
          seen.add(key)
          uniqueAddresses.push(addr)
        } else {
          addressesChanged = true
          console.log(`  - Removing duplicate address for user ${user.email}`)
        }
      }

      // Check for multiple defaults
      const defaultAddresses = uniqueAddresses.filter((addr: any) => addr.isDefault)
      
      if (defaultAddresses.length > 1) {
        // Keep only the first default
        uniqueAddresses.forEach((addr: any, index: number) => {
          const isFirstDefault = addr.isDefault && uniqueAddresses.findIndex((a: any) => a.isDefault) === index
          addr.isDefault = isFirstDefault
        })
        addressesChanged = true
        totalDefaultsFixed++
        console.log(`  - Fixed multiple defaults for user ${user.email}`)
      } else if (defaultAddresses.length === 0) {
        // Make first address default
        uniqueAddresses[0].isDefault = true
        addressesChanged = true
        totalDefaultsFixed++
        console.log(`  - Set first address as default for user ${user.email}`)
      }

      // Update user if changes were made
      if (addressesChanged) {
        user.addresses = uniqueAddresses
        await user.save()
        totalCleaned++
        console.log(`  ✓ Cleaned addresses for user ${user.email}`)
      }
    }

    console.log('\n=== Cleanup Summary ===')
    console.log(`Users processed: ${users.length}`)
    console.log(`Users with changes: ${totalCleaned}`)
    console.log(`Defaults fixed: ${totalDefaultsFixed}`)
    console.log('Cleanup completed successfully!')

  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

cleanupDuplicateAddresses()
