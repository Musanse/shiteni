const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function updateStoreUsers() {
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
    
    // Find store users without storeName
    const storeUsers = await User.find({ 
      serviceType: 'store',
      $or: [
        { storeName: { $exists: false } },
        { storeName: null },
        { storeName: '' }
      ]
    });
    
    console.log(`\n🔍 Found ${storeUsers.length} store users without store name:`);
    
    for (const user of storeUsers) {
      console.log(`\n--- Updating User: ${user.email} ---`);
      
      const updates = {
        storeName: user.storeName || `${user.firstName} ${user.lastName}'s Store`,
        storeDescription: user.storeDescription || `Welcome to ${user.firstName} ${user.lastName}'s store!`,
        storeCategory: user.storeCategory || 'General',
        currency: user.currency || 'ZMW',
        timezone: user.timezone || 'Africa/Lusaka',
        language: user.language || 'en',
        businessHours: user.businessHours || {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '10:00', close: '16:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: false }
        },
        notifications: user.notifications || {
          emailNotifications: true,
          smsNotifications: false,
          orderNotifications: true,
          inventoryNotifications: true,
          customerNotifications: true
        },
        appearance: user.appearance || {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          logo: '',
          favicon: ''
        },
        security: user.security || {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordPolicy: 'medium'
        }
      };
      
      await User.findByIdAndUpdate(user._id, updates);
      
      console.log('✅ Updated store name:', updates.storeName);
      console.log('✅ Updated store description:', updates.storeDescription);
      console.log('✅ Updated store category:', updates.storeCategory);
    }
    
    console.log(`\n🎉 Successfully updated ${storeUsers.length} store users!`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateStoreUsers();
