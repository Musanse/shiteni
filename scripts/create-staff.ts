import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';
import { Institution } from '../src/models/Institution';

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
      console.log(`  Institution ID: ${existingStaff.institutionId}`);
      
      process.exit(0);
      return;
    }

    // Find an institution to assign the staff to
    const institution = await Institution.findOne();
    
    if (!institution) {
      console.error('No institution found. Please create an institution first.');
      process.exit(1);
      return;
    }

    console.log(`Found institution: ${institution.name} (${institution._id})`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user
    const staff = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'staff',
      kycStatus: 'verified',
      institutionId: institution._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Staff user created successfully!');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${staff.role}`);
    console.log(`  Institution: ${institution.name}`);
    console.log(`  Institution ID: ${staff.institutionId}`);
    console.log('\nYou can now log in at /auth/signin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating staff:', error);
    process.exit(1);
  }
}

createStaff();

