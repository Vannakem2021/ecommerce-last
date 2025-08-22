/**
 * Email Normalization Migration Script
 * 
 * This script normalizes all email addresses in the database to lowercase
 * to fix case sensitivity issues in authentication.
 * 
 * Run this script once to clean up existing data:
 * node scripts/normalize-emails.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function normalizeEmails() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find all users
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    let duplicateCount = 0;
    const duplicates = [];
    
    for (const user of users) {
      const originalEmail = user.email;
      const normalizedEmail = originalEmail.toLowerCase().trim();
      
      if (originalEmail !== normalizedEmail) {
        // Check if normalized email already exists
        const existingUser = await usersCollection.findOne({ 
          email: normalizedEmail,
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          console.log(`⚠️  Duplicate found: ${originalEmail} -> ${normalizedEmail}`);
          console.log(`   Original user: ${user._id} (${user.name})`);
          console.log(`   Existing user: ${existingUser._id} (${existingUser.name})`);
          duplicates.push({
            original: { id: user._id, email: originalEmail, name: user.name },
            existing: { id: existingUser._id, email: existingUser.email, name: existingUser.name }
          });
          duplicateCount++;
        } else {
          // Safe to update
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { email: normalizedEmail } }
          );
          console.log(`✅ Updated: ${originalEmail} -> ${normalizedEmail}`);
          updatedCount++;
        }
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Total users processed: ${users.length}`);
    console.log(`- Emails updated: ${updatedCount}`);
    console.log(`- Duplicates found: ${duplicateCount}`);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate Email Conflicts:');
      console.log('The following users have email conflicts that need manual resolution:');
      duplicates.forEach((dup, index) => {
        console.log(`\n${index + 1}. Conflict:`);
        console.log(`   User A: ${dup.original.name} (${dup.original.id}) - ${dup.original.email}`);
        console.log(`   User B: ${dup.existing.name} (${dup.existing.id}) - ${dup.existing.email}`);
      });
      
      console.log('\n🔧 Manual Resolution Required:');
      console.log('1. Review the duplicate users above');
      console.log('2. Decide which user to keep or merge data');
      console.log('3. Delete or rename the duplicate user');
      console.log('4. Re-run this script to complete normalization');
    } else {
      console.log('\n✅ Email normalization completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  normalizeEmails().catch(console.error);
}

module.exports = { normalizeEmails };
