// Script to accurately check bus data and find the booking issue
const mongoose = require('mongoose');

const debugBusBooking = async () => {
  try {
    // Connect to Atlas MongoDB
    const atlasUri = 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(atlasUri);
    console.log('Connected to Atlas MongoDB');

    const db = mongoose.connection.db;

    // Get your vendor account
    const usersCollection = db.collection('users');
    const vendor = await usersCollection.findOne({ email: 'd@gmail.com' });
    
    if (!vendor) {
      console.log('❌ Vendor account not found');
      return;
    }

    console.log(`✅ Found vendor: ${vendor.email} (ID: ${vendor._id})`);

    // Check ALL buses in busfleet collection (not filtered by busCompanyId)
    const busfleetCollection = db.collection('busfleet');
    const allBuses = await busfleetCollection.find({}).toArray();
    
    console.log(`\n🚌 ALL Buses in busfleet collection: ${allBuses.length}`);
    allBuses.forEach((bus, index) => {
      console.log(`  ${index + 1}. Bus ID: ${bus._id}`);
      console.log(`     Bus Name: ${bus.busName || bus.name || 'N/A'}`);
      console.log(`     Bus Number: ${bus.busNumber || 'N/A'}`);
      console.log(`     Plate: ${bus.licensePlate || bus.plateNumber || 'N/A'}`);
      console.log(`     Bus Company ID: ${bus.busCompanyId || 'N/A'}`);
      console.log(`     Capacity: ${bus.capacity || bus.numberOfSeats || 'N/A'}`);
    });

    // Check buses filtered by your vendor ID
    const vendorBuses = await busfleetCollection.find({ busCompanyId: vendor._id }).toArray();
    console.log(`\n🚌 Buses for your vendor (${vendor._id}): ${vendorBuses.length}`);

    // Check ALL trips in bustrips collection
    const bustripsCollection = db.collection('bustrips');
    const allTrips = await bustripsCollection.find({}).toArray();
    
    console.log(`\n📊 ALL Trips in bustrips collection: ${allTrips.length}`);
    allTrips.forEach((trip, index) => {
      console.log(`  ${index + 1}. Trip ID: ${trip._id}`);
      console.log(`     Trip Name: ${trip.tripName || 'N/A'}`);
      console.log(`     Route ID: ${trip.routeId}`);
      console.log(`     Bus ID: ${trip.busId}`);
      console.log(`     Bus Company ID: ${trip.busCompanyId || 'N/A'}`);
    });

    // Check trips for your vendor
    const vendorTrips = await bustripsCollection.find({ busCompanyId: vendor._id }).toArray();
    console.log(`\n📊 Trips for your vendor: ${vendorTrips.length}`);

    // Check ALL routes
    const busroutesCollection = db.collection('busroutes');
    const allRoutes = await busroutesCollection.find({}).toArray();
    
    console.log(`\n🛣️ ALL Routes in busroutes collection: ${allRoutes.length}`);
    allRoutes.forEach((route, index) => {
      console.log(`  ${index + 1}. Route ID: ${route._id}`);
      console.log(`     Route Name: ${route.routeName || 'N/A'}`);
      console.log(`     Bus Company ID: ${route.busCompanyId || 'N/A'}`);
      console.log(`     Stops: ${route.stops?.length || 0}`);
    });

    // Now let's simulate what happens during booking
    console.log('\n🔍 SIMULATING BOOKING PROCESS...');
    
    if (vendorTrips.length > 0) {
      const trip = vendorTrips[0];
      console.log(`\nUsing trip: ${trip.tripName} (ID: ${trip._id})`);
      
      // Try to find the route
      const routeData = await busroutesCollection.findOne({ _id: new mongoose.Types.ObjectId(trip.routeId) });
      console.log(`Route lookup for ${trip.routeId}: ${routeData ? '✅ FOUND' : '❌ NOT FOUND'}`);
      
      if (routeData) {
        console.log(`   Route Name: ${routeData.routeName}`);
        console.log(`   Stops: ${routeData.stops?.length || 0}`);
      }
      
      // Try to find the bus
      const busData = await busfleetCollection.findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });
      console.log(`Bus lookup for ${trip.busId}: ${busData ? '✅ FOUND' : '❌ NOT FOUND'}`);
      
      if (busData) {
        console.log(`   Bus Name: ${busData.busName || busData.name || 'N/A'}`);
        console.log(`   Bus Number: ${busData.busNumber || 'N/A'}`);
        console.log(`   Capacity: ${busData.capacity || busData.numberOfSeats || 'N/A'}`);
      }
      
      // This is what causes the "Route or bus not found" error
      if (!routeData || !busData) {
        console.log('\n🚨 THIS IS WHY BOOKING FAILS!');
        if (!routeData) console.log('   ❌ Route not found');
        if (!busData) console.log('   ❌ Bus not found');
      } else {
        console.log('\n✅ Both route and bus found - booking should work!');
      }
    }

    // Check if there are any buses that match the trip's busId
    console.log('\n🔍 CHECKING FOR BUS ID MATCHES...');
    for (const trip of vendorTrips) {
      const matchingBus = allBuses.find(bus => bus._id.toString() === trip.busId.toString());
      console.log(`Trip ${trip._id} expects bus ${trip.busId}: ${matchingBus ? '✅ MATCH FOUND' : '❌ NO MATCH'}`);
      
      if (matchingBus) {
        console.log(`   Matching bus: ${matchingBus.busName || matchingBus.name || 'N/A'} (${matchingBus.licensePlate || matchingBus.plateNumber || 'N/A'})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from Atlas MongoDB');
  }
};

debugBusBooking();
