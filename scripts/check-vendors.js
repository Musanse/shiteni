const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';

async function checkVendors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Check all users with business roles
    const vendors = await User.find({ 
      role: { $in: ['manager', 'admin', 'super_admin'] } 
    }).select('firstName lastName email role status kycStatus createdAt').lean();
    
    console.log(`\n📊 Found ${vendors.length} vendors:`);
    console.log('=' .repeat(60));
    
    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.firstName} ${vendor.lastName}`);
      console.log(`   Email: ${vendor.email}`);
      console.log(`   Role: ${vendor.role}`);
      console.log(`   Status: ${vendor.status || 'undefined'}`);
      console.log(`   KYC Status: ${vendor.kycStatus || 'undefined'}`);
      console.log(`   Created: ${vendor.createdAt}`);
      console.log('   ' + '-'.repeat(40));
    });

    // Check status distribution
    const statusCounts = {};
    vendors.forEach(vendor => {
      const status = vendor.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkVendors();
