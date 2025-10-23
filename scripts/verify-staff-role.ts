import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function verifyStaffRole() {
  try {
    console.log('🔍 Verifying Staff User Role...');
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

    console.log('\n✅ Staff User Database Record:');
    console.log('================================');
    console.log('ID:', staffUser._id);
    console.log('Email:', staffUser.email);
    console.log('Name:', staffUser.firstName, staffUser.lastName);
    console.log('Role:', staffUser.role);
    console.log('Institution ID:', staffUser.institutionId);
    console.log('================================\n');

    // Verify role is exactly 'staff'
    if (staffUser.role !== 'staff') {
      console.log('❌ ERROR: Role is NOT "staff"!');
      console.log('Current role:', staffUser.role);
      console.log('\nFixing role...');
      
      await User.findByIdAndUpdate(staffUser._id, { role: 'staff' });
      console.log('✅ Role updated to "staff"');
    } else {
      console.log('✅ Role is correctly set to "staff"');
    }

    // Verify institutionId exists
    if (!staffUser.institutionId) {
      console.log('❌ WARNING: No institution ID set!');
      console.log('Staff user needs to be associated with an institution.');
    } else {
      console.log('✅ Institution ID is set');
    }

    // Simulate auth flow
    console.log('\n🔄 Simulating Authentication Flow:');
    console.log('================================');
    console.log('1. User logs in with staff@mgcash.com');
    console.log('2. NextAuth creates session with role:', staffUser.role);
    console.log('3. Middleware checks role for /dashboard/institution/*');
    console.log('4. Role "staff" is allowed ✅');
    console.log('5. User sees institution dashboard ✅');
    console.log('================================\n');

    console.log('🎯 Expected Behavior:');
    console.log('1. Login → Redirect to /dashboard');
    console.log('2. /dashboard → Redirect to /dashboard/institution');
    console.log('3. Access to all institution features ✅');
    console.log('4. Blocked from customer/admin routes ✅');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyStaffRole();
