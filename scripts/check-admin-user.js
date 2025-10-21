#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = (process.env.MONGODB_URI || 'mongodb+srv://zeedemypartners_db:3AppIBO7giz76JLn@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').replace(/"/g, '');

console.log('🔍 Checking for admin user in MongoDB...');

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

async function checkAdminUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@mankuca.com' });
    
    if (adminUser) {
      console.log('✅ Admin user already exists');
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Email Verified:', adminUser.emailVerified);
      console.log('   KYC Status:', adminUser.kycStatus);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('   Password (admin123):', isPasswordValid ? '✅ Valid' : '❌ Invalid');
      
    } else {
      console.log('⚠️  Admin user not found, creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@mankuca.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
        kycStatus: 'verified'
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@mankuca.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
      console.log('   Email Verified: true');
      console.log('   KYC Status: verified');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Admin user check completed');
    console.log('\n🚀 You can now start the app and login with:');
    console.log('   Email: admin@mankuca.com');
    console.log('   Password: admin123');
  }
}

// Run the check
checkAdminUser();
