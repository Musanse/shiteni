import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';
import { Institution } from '../src/models/Institution';
import { Loan } from '../src/models/Loan';
import { LoanApplication } from '../src/models/LoanApplication';

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
    const institutionCount = await Institution.countDocuments();
    const loanCount = await Loan.countDocuments();
    const applicationCount = await LoanApplication.countDocuments();
    
    console.log('📊 Database stats:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Institutions: ${institutionCount}`);
    console.log(`  Loans: ${loanCount}`);
    console.log(`  Applications: ${applicationCount}`);
    
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection();
