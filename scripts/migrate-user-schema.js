/**
 * User Schema Migration Script
 * 
 * This script updates existing users to include the missing paymentMethod and address fields
 * that are required by the IUserInput interface but were missing from the User model schema.
 * 
 * Run this script to fix authentication inconsistencies:
 * node scripts/migrate-user-schema.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateUserSchema() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find all users that are missing the required fields
    const usersToUpdate = await usersCollection.find({
      $or: [
        { paymentMethod: { $exists: false } },
        { address: { $exists: false } },
        { 'address.fullName': { $exists: false } },
        { 'address.street': { $exists: false } },
        { 'address.city': { $exists: false } },
        { 'address.province': { $exists: false } },
        { 'address.postalCode': { $exists: false } },
        { 'address.country': { $exists: false } },
        { 'address.phone': { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users that need schema updates`);
    
    let updatedCount = 0;
    
    for (const user of usersToUpdate) {
      const updateFields = {};
      
      // Add missing paymentMethod or migrate from Stripe/PayPal
      if (!user.paymentMethod || user.paymentMethod === 'Stripe' || user.paymentMethod === 'PayPal') {
        updateFields.paymentMethod = 'ABA PayWay';
      }
      
      // Add missing address fields
      if (!user.address) {
        updateFields.address = {
          fullName: user.name || '',
          street: '',
          city: '',
          province: '',
          postalCode: '',
          country: '',
          phone: ''
        };
      } else {
        // Update individual missing address fields
        const addressUpdates = {};
        if (!user.address.fullName) addressUpdates['address.fullName'] = user.name || '';
        if (!user.address.street) addressUpdates['address.street'] = '';
        if (!user.address.city) addressUpdates['address.city'] = '';
        if (!user.address.province) addressUpdates['address.province'] = '';
        if (!user.address.postalCode) addressUpdates['address.postalCode'] = '';
        if (!user.address.country) addressUpdates['address.country'] = '';
        if (!user.address.phone) addressUpdates['address.phone'] = '';
        
        Object.assign(updateFields, addressUpdates);
      }
      
      if (Object.keys(updateFields).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updateFields }
        );
        
        console.log(`✅ Updated user: ${user.name} (${user.email})`);
        updatedCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Users found needing updates: ${usersToUpdate.length}`);
    console.log(`- Users successfully updated: ${updatedCount}`);
    
    // Verify the migration
    const remainingIncompleteUsers = await usersCollection.find({
      $or: [
        { paymentMethod: { $exists: false } },
        { address: { $exists: false } },
        { 'address.fullName': { $exists: false } },
        { 'address.street': { $exists: false } },
        { 'address.city': { $exists: false } },
        { 'address.province': { $exists: false } },
        { 'address.postalCode': { $exists: false } },
        { 'address.country': { $exists: false } },
        { 'address.phone': { $exists: false } }
      ]
    }).toArray();
    
    if (remainingIncompleteUsers.length === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('All users now have complete schema fields.');
    } else {
      console.log(`\n⚠️  ${remainingIncompleteUsers.length} users still have incomplete schemas.`);
      console.log('You may need to run the migration again or check for errors.');
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
  migrateUserSchema().catch(console.error);
}

module.exports = { migrateUserSchema };
