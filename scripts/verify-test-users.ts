import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function verifyTestUsers() {
  try {
    console.log('🔍 Connecting to database...');
    
    const connection = await connectDB();
    
    if (!connection) {
      console.error('❌ Database connection failed');
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Find users with unverified emails
    const unverifiedUsers = await User.find({ emailVerified: false });
    
    console.log(`📊 Found ${unverifiedUsers.length} unverified users`);
    
    if (unverifiedUsers.length > 0) {
      console.log('🔧 Verifying test users...');
      
      // Verify all unverified users for testing
      const result = await User.updateMany(
        { emailVerified: false },
        { 
          $set: { 
            emailVerified: true,
            emailVerificationToken: undefined,
            emailVerificationExpires: undefined
          }
        }
      );
      
      console.log(`✅ Verified ${result.modifiedCount} users`);
      
      // Show verified users
      const verifiedUsers = await User.find({ emailVerified: true }).select('email firstName lastName role');
      console.log('📋 Verified users:');
      verifiedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
      });
    } else {
      console.log('✅ All users are already verified');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyTestUsers();
