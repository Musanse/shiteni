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
    console.log('Service Type:', staffUser.serviceType);
    console.log('Business Name:', staffUser.businessName);
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
    console.log('serviceType:', staffUser.serviceType);
    console.log('businessName:', staffUser.businessName);
    console.log('================================\n');

    // Verify role is correct
    if (staffUser.role === 'admin') {
      console.log('✅ Role is correctly set to "admin"');
    } else {
      console.log('❌ Role is NOT "admin", it is:', staffUser.role);
      console.log('This is why the user is being redirected to the wrong dashboard!');
    }

    // Check all users with admin role
    console.log('\nAll users with "admin" role:');
    console.log('================================');
    const allAdmins = await User.find({ role: 'admin' });
    console.log(`Found ${allAdmins.length} admin users:`);
    allAdmins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.firstName} ${admin.lastName})`);
    });
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStaffUser();

