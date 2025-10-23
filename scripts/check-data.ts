import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';

async function checkData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const users = await User.find({});

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Service: ${user.serviceType || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkData();
