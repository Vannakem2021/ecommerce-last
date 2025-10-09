/**
 * Production Database Seeding Script
 * 
 * This script safely seeds your production database via API
 * 
 * Usage:
 *   node scripts/seed-production.js
 * 
 * Requirements:
 *   - Admin account must exist OR use initial admin credentials
 *   - SEED_SECRET environment variable must match production
 */

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function seedProduction() {
  try {
    console.log('🌱 Production Database Seeding Tool\n')
    console.log('⚠️  WARNING: This will DELETE ALL data in your database!\n')

    // Get required information
    const url = await question('Enter your Vercel URL (e.g., https://your-app.vercel.app): ')
    const email = await question('Enter admin email: ')
    const password = await question('Enter admin password: ')
    const seedSecret = await question('Enter SEED_SECRET: ')
    
    const confirm = await question('\n❓ Type "DELETE_ALL_DATA" to confirm: ')
    
    if (confirm !== 'DELETE_ALL_DATA') {
      console.log('❌ Seeding cancelled')
      rl.close()
      return
    }

    console.log('\n🔐 Step 1: Logging in...')
    
    // Step 1: Login to get session
    const loginResponse = await fetch(`${url}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse.ok) {
      throw new Error('Login failed. Check your credentials.')
    }

    // Get session cookie
    const setCookie = loginResponse.headers.get('set-cookie')
    
    console.log('✅ Logged in successfully\n')
    console.log('🌱 Step 2: Seeding database...')

    // Step 2: Call seed endpoint
    const seedResponse = await fetch(`${url}/api/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': setCookie || '',
        'x-seed-secret': seedSecret,
      },
      body: JSON.stringify({
        confirm: 'DELETE_ALL_DATA'
      }),
    })

    const result = await seedResponse.json()

    if (!seedResponse.ok) {
      throw new Error(result.message || 'Seeding failed')
    }

    console.log('\n✅ Database seeded successfully!\n')
    console.log('📊 Statistics:')
    console.log(`   Users: ${result.stats.users}`)
    console.log(`   Products: ${result.stats.products}`)
    console.log(`   Orders: ${result.stats.orders}`)
    console.log(`   Categories: ${result.stats.categories}`)
    console.log(`   Brands: ${result.stats.brands}`)
    
    if (result.credentials) {
      console.log('\n🔐 Admin Credentials:')
      console.log(`   Email: ${result.credentials.email}`)
      console.log(`   Password: ${result.credentials.password}`)
      console.log(`   ⚠️  ${result.credentials.warning}`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    rl.close()
  }
}

seedProduction()
