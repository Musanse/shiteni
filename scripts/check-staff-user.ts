import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function checkStaffUser() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const staffEmail = 'staff@mgcash.com';
    
    // Find the staff user
    const staffUser = await User.findOne({ email: staffEmail });
    
    if (!staffUser) {
      console.log('❌ Staff user not found!');
      console.log('Please run: npx tsx scripts/create-staff.ts');
      process.exit(1);
      return;
    }

    console.log('\n✅ Staff user found in database:');
    console.log('================================');
    console.log('ID:', staffUser._id);
    console.log('Email:', staffUser.email);
    console.log('First Name:', staffUser.firstName);
    console.log('Last Name:', staffUser.lastName);
    console.log('Role:', staffUser.role);
    console.log('KYC Status:', staffUser.kycStatus);
    console.log('Institution ID:', staffUser.institutionId);
    console.log('Created At:', staffUser.createdAt);
    console.log('================================\n');

    // Check what auth.ts will return
    console.log('What NextAuth will return:');
    console.log('================================');
    console.log('id:', staffUser._id.toString());
    console.log('email:', staffUser.email);
    console.log('firstName:', staffUser.firstName);
    console.log('lastName:', staffUser.lastName);
    console.log('role:', staffUser.role);
    console.log('kycStatus:', staffUser.kycStatus);
    console.log('institutionId:', staffUser.institutionId?.toString());
    console.log('================================\n');

    // Verify role is correct
    if (staffUser.role === 'staff') {
      console.log('✅ Role is correctly set to "staff"');
    } else {
      console.log('❌ Role is NOT "staff", it is:', staffUser.role);
      console.log('This is why the user is being redirected to the wrong dashboard!');
    }

    // Check all users with staff role
    console.log('\nAll users with "staff" role:');
    console.log('================================');
    const allStaff = await User.find({ role: 'staff' });
    console.log(`Found ${allStaff.length} staff users:`);
    allStaff.forEach(staff => {
      console.log(`- ${staff.email} (${staff.firstName} ${staff.lastName})`);
    });
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStaffUser();

