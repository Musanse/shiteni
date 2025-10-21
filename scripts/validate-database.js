#!/usr/bin/env node

/**
 * Database Connection Validator
 * Ensures the application only connects to the correct database
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function validateDatabaseConnection() {
  console.log('🔍 Database Connection Validator');
  console.log('=================================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set');
    process.exit(1);
  }
  
  // Validate URI contains correct database name
  if (!mongoUri.includes('/mankuca')) {
    console.log('❌ CRITICAL ERROR: MongoDB URI does not specify mankuca database!');
    console.log('   Current URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    console.log('   Expected: ...mongodb.net/mankuca?...');
    process.exit(1);
  }
  
  if (mongoUri.includes('/test')) {
    console.log('❌ CRITICAL ERROR: MongoDB URI points to test database!');
    console.log('   This will cause data corruption!');
    process.exit(1);
  }
  
  console.log('✅ MongoDB URI validation passed');
  console.log('   Database: mankuca');
  
  try {
    console.log('\n🔄 Testing connection...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log('✅ Connected successfully');
    console.log(`📊 Connected to database: ${dbName}`);
    
    if (dbName !== 'mankuca') {
      console.log('❌ CRITICAL ERROR: Connected to wrong database!');
      console.log(`   Expected: mankuca`);
      console.log(`   Actual: ${dbName}`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // List collections to verify it's the right database
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in mankuca database:`);
    
    const expectedCollections = ['users', 'loans', 'institutions', 'messages'];
    const foundExpected = expectedCollections.filter(col => 
      collections.some(c => c.name === col)
    );
    
    console.log(`   Expected collections found: ${foundExpected.length}/${expectedCollections.length}`);
    foundExpected.forEach(col => {
      console.log(`   ✅ ${col}`);
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 Database connection validation PASSED');
    console.log('   ✅ Correct database: mankuca');
    console.log('   ✅ No test database access');
    console.log('   ✅ Application is safe to run');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

validateDatabaseConnection();
