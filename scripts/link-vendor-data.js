// Script to link actual vendor account to sample data
const mongoose = require('mongoose');

const linkVendorData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Find the actual bus vendor (not the test one)
    const usersCollection = db.collection('users');
    const busVendors = await usersCollection.find({ 
      serviceType: 'bus',
      email: { $ne: 'bus@test.com' } // Exclude test vendor
    }).toArray();
    
    console.log('Actual bus vendors found:');
    busVendors.forEach(vendor => {
      console.log(`- ID: ${vendor._id}, Email: ${vendor.email}, Name: ${vendor.name || vendor.businessName || 'N/A'}`);
    });

    if (busVendors.length === 0) {
      console.log('No actual bus vendors found. You need to create a bus vendor account first.');
      return;
    }

    const actualVendor = busVendors[0]; // Use the first actual vendor
    console.log(`\nUsing vendor: ${actualVendor.email} (${actualVendor._id})`);

    // Update sample data to belong to the actual vendor
    const updates = [
      // Update routes
      {
        collection: 'busroutes',
        filter: { busCompanyId: '68f703c7203014104cc19491' },
        update: { $set: { busCompanyId: actualVendor._id } }
      },
      // Update trips
      {
        collection: 'bustrips',
        filter: { busCompanyId: '68f703c7203014104cc19491' },
        update: { $set: { busCompanyId: actualVendor._id } }
      },
      // Update fleet
      {
        collection: 'busfleet',
        filter: { busCompanyId: '68f703c7203014104cc19491' },
        update: { $set: { busCompanyId: actualVendor._id } }
      },
      // Update fares
      {
        collection: 'busfares',
        filter: { busCompanyId: '68f703c7203014104cc19491' },
        update: { $set: { busCompanyId: actualVendor._id } }
      }
    ];

    for (const update of updates) {
      const result = await db.collection(update.collection).updateMany(
        update.filter,
        update.update
      );
      console.log(`Updated ${result.modifiedCount} documents in ${update.collection}`);
    }

    // Remove the test vendor
    await usersCollection.deleteOne({ email: 'bus@test.com' });
    console.log('Removed test vendor account');

    console.log('\n✅ Data linking completed!');
    console.log(`All sample data now belongs to: ${actualVendor.email}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

linkVendorData();
