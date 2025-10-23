import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createAdminUser() {
  try {
    await connectDB();
    console.log('🌱 Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@mankuca.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@mankuca.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mankuca.com',
      password: adminPassword,
      role: 'admin',
      kycStatus: 'verified',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@mankuca.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Role: admin');
    console.log('✅ KYC Status: verified');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdminUser();
