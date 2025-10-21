import connectDB from '../src/lib/mongodb';
import { User } from '../src/models/User';
import { Institution } from '../src/models/Institution';

async function checkData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const users = await User.find({});
    const institutions = await Institution.find({});

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });

    console.log(`\nFound ${institutions.length} institutions:`);
    institutions.forEach(inst => {
      console.log(`- ${inst.name} (${inst.email}) - Status: ${inst.status}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkData();
