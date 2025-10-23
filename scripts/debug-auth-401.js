#!/usr/bin/env node

/**
 * Authentication Debug Script
 * Helps diagnose 401 Unauthorized errors in NextAuth
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Authentication Debug Tool');
console.log('============================\n');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('📋 Environment Variables Check:');
  console.log('--------------------------------');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'MONGODB_URI',
    'NEXTAUTH_URL'
  ];
  
  const optionalVars = [
    'NODE_ENV',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
  ];
  
  let allRequiredPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'MONGODB_URI' ? '[HIDDEN]' : '[SET]'}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allRequiredPresent = false;
    }
  });
  
  console.log('\n📋 Optional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${value ? '✅' : '⚠️'} ${varName}: ${value || 'NOT SET'}`);
  });
  
  console.log(`\n${allRequiredPresent ? '✅' : '❌'} All required environment variables ${allRequiredPresent ? 'are set' : 'are missing'}\n`);
  
  return allRequiredPresent;
}

// Test MongoDB connection
async function testMongoDBConnection() {
  console.log('🗄️ MongoDB Connection Test:');
  console.log('-----------------------------');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set');
    return false;
  }
  
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection successful');
    
    // Test if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database accessible, found ${collections.length} collections`);
    
    // Check if User collection exists
    const userCollection = collections.find(col => col.name === 'users');
    if (userCollection) {
      console.log('✅ Users collection found');
      
      // Count users
      const userCount = await db.collection('users').countDocuments();
      console.log(`✅ Found ${userCount} users in database`);
      
      // List first few users (without passwords)
      const users = await db.collection('users').find({}, { 
        projection: { email: 1, role: 1, emailVerified: 1, createdAt: 1 } 
      }).limit(3).toArray();
      
      if (users.length > 0) {
        console.log('\n📋 Sample Users:');
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. Email: ${user.email}`);
          console.log(`     Role: ${user.role || 'Not set'}`);
          console.log(`     Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
          console.log(`     Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}`);
          console.log('');
        });
      }
    } else {
      console.log('⚠️ Users collection not found');
    }
    
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
    return true;
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('Authentication failed')) {
      console.log('   💡 This is likely a credentials issue');
      console.log('   💡 Check your MongoDB Atlas username/password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   💡 This is likely a network/DNS issue');
      console.log('   💡 Check your MongoDB Atlas cluster URL');
    } else if (error.message.includes('timeout')) {
      console.log('   💡 This is likely a network timeout');
      console.log('   💡 Check your internet connection and MongoDB Atlas network access');
    }
    
    return false;
  }
}

// Test authentication flow
async function testAuthenticationFlow() {
  console.log('🔐 Authentication Flow Test:');
  console.log('-----------------------------');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.log('❌ Cannot test authentication - MONGODB_URI not set');
    return false;
  }
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for auth test');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Test with a sample email (you can modify this)
    const testEmail = 'admin@mankuca.com'; // Change this to an email you know exists
    console.log(`🔄 Testing authentication for: ${testEmail}`);
    
    const user = await usersCollection.findOne({ email: testEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${testEmail}`);
      console.log('💡 Try with a different email address');
      return false;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Role: ${user.role || 'Not set'}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    
    if (!user.emailVerified) {
      console.log('❌ Email not verified - this will cause 401 error');
      console.log('💡 User must verify email before login');
      return false;
    }
    
    if (!user.password) {
      console.log('❌ No password hash found');
      console.log('💡 User may not have completed registration');
      return false;
    }
    
    console.log('✅ User appears to be properly configured for login');
    
    await mongoose.disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Authentication test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting authentication debug...\n');
  
  // Step 1: Check environment variables
  const envOk = checkEnvironmentVariables();
  
  // Step 2: Test MongoDB connection
  const mongoOk = await testMongoDBConnection();
  
  // Step 3: Test authentication flow
  const authOk = await testAuthenticationFlow();
  
  // Summary
  console.log('📊 Summary:');
  console.log('===========');
  console.log(`Environment Variables: ${envOk ? '✅ OK' : '❌ ISSUES'}`);
  console.log(`MongoDB Connection: ${mongoOk ? '✅ OK' : '❌ ISSUES'}`);
  console.log(`Authentication Flow: ${authOk ? '✅ OK' : '❌ ISSUES'}`);
  
  if (envOk && mongoOk && authOk) {
    console.log('\n🎉 All checks passed! Authentication should work.');
    console.log('💡 If you\'re still getting 401 errors, check:');
    console.log('   - Browser console for additional errors');
    console.log('   - Network tab for request details');
    console.log('   - Server logs for backend errors');
  } else {
    console.log('\n🚨 Issues found that need to be fixed:');
    if (!envOk) {
      console.log('   - Set missing environment variables');
    }
    if (!mongoOk) {
      console.log('   - Fix MongoDB connection');
    }
    if (!authOk) {
      console.log('   - Fix authentication configuration');
    }
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix any issues identified above');
  console.log('2. Restart your development server');
  console.log('3. Try logging in again');
  console.log('4. Check browser console for errors');
}

// Run the debug tool
main().catch(console.error);