const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';

async function createVendorTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Create test vendors with manager role (these are actual vendors)
    const testVendors = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@vendor.com',
        password: await bcrypt.hash('password123', 12),
        role: 'manager', // This makes them a vendor
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        status: 'pending', // Vendors start as pending
        kycStatus: 'pending',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@vendor.com',
        password: await bcrypt.hash('password123', 12),
        role: 'manager', // This makes them a vendor
        phone: '+1234567891',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        status: 'active', // This vendor is already approved
        kycStatus: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@vendor.com',
        password: await bcrypt.hash('password123', 12),
        role: 'manager', // This makes them a vendor
        phone: '+1234567892',
        address: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        status: 'suspended', // This vendor is suspended
        kycStatus: 'verified',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('\n🔄 Creating test vendors...');
    
    for (const vendor of testVendors) {
      // Check if vendor already exists
      const existingVendor = await User.findOne({ email: vendor.email });
      if (existingVendor) {
        console.log(`⚠️  Vendor ${vendor.email} already exists, updating...`);
        existingVendor.firstName = vendor.firstName;
        existingVendor.lastName = vendor.lastName;
        existingVendor.role = vendor.role;
        existingVendor.status = vendor.status;
        existingVendor.kycStatus = vendor.kycStatus;
        existingVendor.address = vendor.address;
        existingVendor.updatedAt = new Date();
        await existingVendor.save();
        console.log(`✅ Updated ${vendor.email} with status: ${vendor.status}`);
      } else {
        const newVendor = new User(vendor);
        await newVendor.save();
        console.log(`✅ Created ${vendor.email} with status: ${vendor.status}`);
      }
    }

    console.log('\n📊 Test vendors created successfully!');
    
    // Verify the vendors
    const vendors = await User.find({ 
      role: 'manager'
    }).select('firstName lastName email role status kycStatus').lean();
    
    console.log('\n📋 Current vendor statuses:');
    vendors.forEach(vendor => {
      console.log(`- ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
      console.log(`  Role: ${vendor.role}, Status: ${vendor.status}, KYC: ${vendor.kycStatus}`);
    });

    // Show all users for comparison
    const allUsers = await User.find({}).select('firstName lastName email role status').lean();
    console.log('\n👥 All users in system:');
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  Role: ${user.role}, Status: ${user.status}`);
    });

    console.log('\n✅ Vendor test data setup complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createVendorTestData();
