#!/usr/bin/env node

/**
 * Delete Test Database Script
 * Safely removes the test database from MongoDB
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function deleteTestDatabase() {
  console.log('🗑️ Test Database Deletion Script');
  console.log('=================================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // List all databases first
    console.log('📊 Current databases:');
    const databases = await admin.listDatabases();
    
    databases.databases.forEach((db, index) => {
      console.log(`   ${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check if test database exists
    const testDb = databases.databases.find(db => db.name === 'test');
    
    if (!testDb) {
      console.log('\n✅ No test database found - nothing to delete');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n⚠️ Found test database!');
    console.log(`   Size: ${(testDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
    
    // Method 1: Try to drop the test database directly
    try {
      console.log('\n🗑️ Attempting to delete test database...');
      
      // Connect to test database and drop it
      const testConnection = await mongoose.createConnection(mongoUri.replace('/mankuca', '/test'));
      await testConnection.db.dropDatabase();
      await testConnection.close();
      
      console.log('✅ Test database deleted successfully!');
      
    } catch (error) {
      console.log('❌ Method 1 failed:', error.message);
      
      // Method 2: Try using admin command
      try {
        console.log('\n🔄 Trying alternative method...');
        
        // Switch to test database and drop it
        const testDb = mongoose.connection.useDb('test');
        await testDb.dropDatabase();
        
        console.log('✅ Test database deleted successfully (Method 2)!');
        
      } catch (error2) {
        console.log('❌ Method 2 failed:', error2.message);
        
        // Method 3: Manual collection cleanup
        console.log('\n🔄 Trying manual cleanup...');
        
        const testDb = mongoose.connection.useDb('test');
        const collections = await testDb.db.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log('✅ Test database appears to be empty already');
        } else {
          console.log(`Found ${collections.length} collections in test database:`);
          for (const collection of collections) {
            try {
              await testDb.db.collection(collection.name).drop();
              console.log(`   ✅ Dropped collection: ${collection.name}`);
            } catch (err) {
              console.log(`   ⚠️ Could not drop collection: ${collection.name}`);
            }
          }
          console.log('✅ Test database collections cleaned up');
        }
      }
    }
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const updatedDatabases = await admin.listDatabases();
    const testDbStillExists = updatedDatabases.databases.find(db => db.name === 'test');
    
    if (!testDbStillExists) {
      console.log('✅ Test database successfully deleted!');
    } else {
      console.log('⚠️ Test database still exists (may be empty)');
    }
    
    // Show updated database list
    console.log('\n📊 Updated database list:');
    updatedDatabases.databases.forEach((db, index) => {
      console.log(`   ${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Manual deletion steps:');
    console.log('1. Go to MongoDB Atlas dashboard');
    console.log('2. Navigate to your cluster');
    console.log('3. Go to Collections');
    console.log('4. Find the "test" database');
    console.log('5. Delete it manually');
  }
}

deleteTestDatabase();
