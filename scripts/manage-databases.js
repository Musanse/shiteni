#!/usr/bin/env node

/**
 * MongoDB Database Management Script
 * Lists all databases and safely manages database operations
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function manageDatabases() {
  console.log('🗄️ MongoDB Database Management');
  console.log('==============================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set');
    process.exit(1);
  }
  
  // Safety check: Ensure we're not accidentally connecting to test database
  if (mongoUri.includes('/test')) {
    console.log('🚨 CRITICAL ERROR: MongoDB URI points to test database!');
    console.log('   This script should not be run with test database URI');
    process.exit(1);
  }
  
  if (!mongoUri.includes('/mankuca')) {
    console.log('🚨 CRITICAL ERROR: MongoDB URI does not specify mankuca database!');
    console.log('   Expected: ...mongodb.net/mankuca?...');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    const admin = mongoose.connection.db.admin();
    
    // List all databases
    console.log('📊 Listing all databases:');
    const databases = await admin.listDatabases();
    
    databases.databases.forEach((db, index) => {
      const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      const status = db.name === 'mankuca' ? '✅' : db.name === 'test' ? '⚠️' : '📁';
      console.log(`   ${status} ${index + 1}. ${db.name} (${sizeMB} MB)`);
    });
    
    // Check if test database exists
    const testDb = databases.databases.find(db => db.name === 'test');
    
    if (testDb) {
      console.log('\n⚠️ Found "test" database!');
      console.log(`   Size: ${(testDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      
      // Try to delete the test database using multiple methods
      console.log('\n🗑️ Attempting to delete test database...');
      
      try {
        // Method 1: Switch to test database and drop it
        const testConnection = await mongoose.createConnection(mongoUri.replace('/mankuca', '/test'));
        await testConnection.db.dropDatabase();
        await testConnection.close();
        console.log('✅ Test database deleted successfully!');
      } catch (error) {
        console.log('❌ Method 1 failed:', error.message);
        
        try {
          // Method 2: Use admin command
          const testDbConnection = mongoose.connection.useDb('test');
          await testDbConnection.dropDatabase();
          console.log('✅ Test database deleted successfully (Method 2)!');
        } catch (error2) {
          console.log('❌ Method 2 failed:', error2.message);
          console.log('⚠️ Could not delete test database automatically');
          console.log('💡 Manual deletion required through MongoDB Atlas dashboard');
        }
      }
    } else {
      console.log('\n✅ No "test" database found');
    }
    
    // Verify mankuca database exists and show details
    const mankucaDb = databases.databases.find(db => db.name === 'mankuca');
    
    if (mankucaDb) {
      console.log('\n✅ Mankuca database found');
      console.log(`   Size: ${(mankucaDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      
      // List collections in mankuca database
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   Collections: ${collections.length}`);
      collections.forEach((col, index) => {
        console.log(`     ${index + 1}. ${col.name}`);
      });
    } else {
      console.log('\n❌ Mankuca database not found!');
      console.log('   This is a critical error - your application will not work!');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your MongoDB URI in .env.local');
    console.log('2. Verify MongoDB Atlas connection settings');
    console.log('3. Ensure your IP is whitelisted in MongoDB Atlas');
    process.exit(1);
  }
}

// Add error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

manageDatabases();
