// Script to check all vendor accounts
const mongoose = require('mongoose');

const checkAllVendors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check all users
    const usersCollection = db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log('All users found:');
    allUsers.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, ServiceType: ${user.serviceType || 'N/A'}, Role: ${user.role || 'N/A'}, Name: ${user.name || user.businessName || 'N/A'}`);
    });

    // Check for bus-related accounts
    const busUsers = allUsers.filter(user => 
      user.serviceType === 'bus' || 
      user.role === 'manager' || 
      user.role === 'vendor' ||
      (user.email && user.email.includes('bus'))
    );
    
    console.log('\nBus-related accounts:');
    busUsers.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, ServiceType: ${user.serviceType || 'N/A'}, Role: ${user.role || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkAllVendors();
