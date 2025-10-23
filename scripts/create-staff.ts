import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function createStaff() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const email = 'staff@mgcash.com';
    const password = 'staff123';
    const firstName = 'Staff';
    const lastName = 'Member';

    // Check if staff already exists
    const existingStaff = await User.findOne({ email });
    if (existingStaff) {
      console.log(`Staff user ${email} already exists`);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(password, 10);
      existingStaff.password = hashedPassword;
      await existingStaff.save();
      
      console.log(`Password updated for ${email}`);
      console.log('Login credentials:');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Role: ${existingStaff.role}`);
      console.log(`  Service Type: ${existingStaff.serviceType}`);
      
      process.exit(0);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user
    const staff = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin', // Changed from 'staff' to 'admin' for vendor management
      kycStatus: 'verified',
      serviceType: 'bus', // Default service type
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Staff user created successfully!');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${staff.role}`);
    console.log(`  Service Type: ${staff.serviceType}`);
    console.log('\nYou can now log in at /auth/signin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating staff:', error);
    process.exit(1);
  }
}

createStaff();

