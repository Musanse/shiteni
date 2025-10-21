const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';

async function updateVendorServiceTypes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find all vendors (users with manager role)
    const vendors = await User.find({ role: 'manager' }).select('firstName lastName email serviceType').lean();
    
    console.log(`\n📊 Found ${vendors.length} vendors:`);
    console.log('=' .repeat(60));
    
    for (const vendor of vendors) {
      console.log(`Updating ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
      
      // Set service type based on email or name patterns
      let serviceType = 'hotel'; // Default to hotel
      
      if (vendor.email.includes('store') || vendor.firstName.toLowerCase().includes('store')) {
        serviceType = 'store';
      } else if (vendor.email.includes('pharmacy') || vendor.firstName.toLowerCase().includes('pharmacy')) {
        serviceType = 'pharmacy';
      } else if (vendor.email.includes('bus') || vendor.firstName.toLowerCase().includes('bus')) {
        serviceType = 'bus';
      } else if (vendor.email.includes('hotel') || vendor.firstName.toLowerCase().includes('hotel')) {
        serviceType = 'hotel';
      }
      
      // Update the vendor with service type
      await User.findByIdAndUpdate(vendor._id, { 
        $set: { serviceType: serviceType } 
      });
      
      console.log(`  ✅ Set service type to: ${serviceType}`);
    }

    // Verify the updates
    console.log('\n📋 Updated vendors:');
    const updatedVendors = await User.find({ role: 'manager' }).select('firstName lastName email serviceType').lean();
    
    updatedVendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
      console.log(`   Service Type: ${vendor.serviceType || 'not set'}`);
      console.log('   ' + '-'.repeat(40));
    });

    console.log('\n✅ Vendor service types updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateVendorServiceTypes();
