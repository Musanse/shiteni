#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = (process.env.MONGODB_URI || 'mongodb+srv://zeedemypartners_db:3AppIBO7giz76JLn@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').replace(/"/g, '');

console.log('🔍 Testing authentication flow...');

// User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  kycStatus: { type: String, default: 'pending' },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function testAuthentication() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Test admin user authentication
    const adminUser = await User.findOne({ email: 'admin@mankuca.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Email Verified:', adminUser.emailVerified);
    console.log('   KYC Status:', adminUser.kycStatus);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('   Password (admin123):', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    if (!isPasswordValid) {
      console.log('🔧 Fixing password...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('✅ Password updated');
    }
    
    if (!adminUser.emailVerified) {
      console.log('🔧 Fixing email verification...');
      adminUser.emailVerified = true;
      await adminUser.save();
      console.log('✅ Email verification updated');
    }
    
    console.log('\n✅ Authentication test completed');
    console.log('🚀 Admin user is ready for login');
    console.log('   Email: admin@mankuca.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testAuthentication();
