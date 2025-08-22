'use server'

import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { normalizeRole } from '@/lib/rbac-utils'

/**
 * Migration script to update user roles from old format to new format
 * Old format: 'Admin', 'User'
 * New format: 'admin', 'manager', 'seller', 'user'
 */
export async function migrateUserRoles() {
  try {
    await connectToDatabase()
    
    console.log('Starting user role migration...')
    
    // Find all users with old role format
    const usersToUpdate = await User.find({
      role: { $in: ['Admin', 'User'] }
    })
    
    console.log(`Found ${usersToUpdate.length} users to migrate`)
    
    let updatedCount = 0
    
    for (const user of usersToUpdate) {
      const oldRole = user.role
      const newRole = normalizeRole(oldRole)

      if (oldRole !== newRole) {
        await User.findByIdAndUpdate(user._id, { role: newRole })
        console.log(`Updated user ${user.email}: ${oldRole} -> ${newRole}`)
        updatedCount++
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`)
    
    return {
      success: true,
      message: `Successfully migrated ${updatedCount} users`,
      details: {
        totalFound: usersToUpdate.length,
        updated: updatedCount
      }
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Rollback migration - convert back to old format (for testing purposes)
 */
export async function rollbackUserRoles() {
  try {
    await connectToDatabase()
    
    console.log('Starting user role rollback...')
    
    const usersToRollback = await User.find({
      role: { $in: ['admin', 'manager', 'seller', 'user'] }
    })
    
    console.log(`Found ${usersToRollback.length} users to rollback`)
    
    let rolledBackCount = 0
    
    for (const user of usersToRollback) {
      const currentRole = user.role
      let oldRole: string
      
      // Map new roles back to old format
      switch (currentRole) {
        case 'admin':
          oldRole = 'Admin'
          break
        case 'manager':
        case 'seller':
        case 'user':
          oldRole = 'User'
          break
        default:
          continue // Skip unknown roles
      }
      
      if (currentRole !== oldRole) {
        await User.findByIdAndUpdate(user._id, { role: oldRole })
        console.log(`Rolled back user ${user.email}: ${currentRole} -> ${oldRole}`)
        rolledBackCount++
      }
    }
    
    console.log(`Rollback completed. Updated ${rolledBackCount} users.`)
    
    return {
      success: true,
      message: `Successfully rolled back ${rolledBackCount} users`,
      details: {
        totalFound: usersToRollback.length,
        rolledBack: rolledBackCount
      }
    }
  } catch (error) {
    console.error('Rollback failed:', error)
    return {
      success: false,
      message: 'Rollback failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check current role distribution in the database
 */
export async function checkRoleDistribution() {
  try {
    await connectToDatabase()
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    
    console.log('Current role distribution:')
    roleStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} users`)
    })
    
    return {
      success: true,
      data: roleStats
    }
  } catch (error) {
    console.error('Failed to check role distribution:', error)
    return {
      success: false,
      message: 'Failed to check role distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
