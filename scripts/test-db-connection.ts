import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const connection = await connectDB();
    
    if (!connection) {
      console.error('❌ Database connection failed - no connection returned');
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Test basic queries
    console.log('🔍 Testing basic queries...');
    
    const userCount = await User.countDocuments();
    
    console.log('📊 Database stats:');
    console.log(`  Users: ${userCount}`);
    
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection();
