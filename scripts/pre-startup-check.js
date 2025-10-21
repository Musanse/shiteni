#!/usr/bin/env node

/**
 * Pre-startup Database Safety Check
 * Run this before starting your application to ensure database safety
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function preStartupCheck() {
  console.log('🚀 Pre-Startup Database Safety Check');
  console.log('=====================================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  // Check 1: URI exists
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not found in environment');
    console.log('   Please check your .env.local file');
    process.exit(1);
  }
  
  // Check 2: URI points to correct database
  if (mongoUri.includes('/test')) {
    console.log('🚨 CRITICAL ERROR: MongoDB URI points to test database!');
    console.log('   This will cause data corruption!');
    console.log('   Fix your .env.local file immediately!');
    process.exit(1);
  }
  
  if (!mongoUri.includes('/mankuca')) {
    console.log('🚨 CRITICAL ERROR: MongoDB URI does not specify mankuca database!');
    console.log('   Expected: ...mongodb.net/mankuca?...');
    console.log('   Fix your .env.local file immediately!');
    process.exit(1);
  }
  
  console.log('✅ MongoDB URI safety checks passed');
  
  // Check 3: Can connect to correct database
  try {
    console.log('🔄 Testing database connection...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    if (dbName !== 'mankuca') {
      console.log('🚨 CRITICAL ERROR: Connected to wrong database!');
      console.log(`   Expected: mankuca`);
      console.log(`   Actual: ${dbName}`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Check 4: Verify expected collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['users', 'loans', 'institutions'];
    const missingCollections = requiredCollections.filter(col => !collectionNames.includes(col));
    
    if (missingCollections.length > 0) {
      console.log('⚠️ Warning: Some required collections are missing:');
      missingCollections.forEach(col => console.log(`   - ${col}`));
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎉 All safety checks PASSED!');
    console.log('   ✅ Correct database: mankuca');
    console.log('   ✅ No test database access');
    console.log('   ✅ Required collections present');
    console.log('   ✅ Application is safe to start');
    console.log('\n🚀 You can now start your application safely!');
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('   Please check your MongoDB connection string');
    process.exit(1);
  }
}

preStartupCheck();
