const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkStoreUsers() {
  try {
    // Try to connect with different possible env files
    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      // Try to read from .env.local
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '.env.local');
      
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
        if (mongoMatch) {
          mongoUri = mongoMatch[1].trim();
        }
      }
    }
    
    if (!mongoUri) {
      console.log('❌ No MongoDB URI found. Please check your .env.local file.');
      return;
    }
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Define User schema (simplified)
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    
    // Find store users
    const storeUsers = await User.find({ serviceType: 'store' }).limit(3);
    
    console.log(`\n🔍 Found ${storeUsers.length} store users:`);
    
    storeUsers.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log('Role:', user.role);
      console.log('Service Type:', user.serviceType);
      console.log('Store Name:', user.storeName || 'NOT SET');
      console.log('Store Description:', user.storeDescription || 'NOT SET');
      console.log('Store Category:', user.storeCategory || 'NOT SET');
      console.log('Phone:', user.phone || 'NOT SET');
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStoreUsers();
