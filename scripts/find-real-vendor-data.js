// Script to check all bus data and find the real vendor
const mongoose = require('mongoose');

const findRealVendorData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check all bus-related collections
    console.log('=== BUS ROUTES ===');
    const busroutesCollection = db.collection('busroutes');
    const routes = await busroutesCollection.find({}).toArray();
    console.log(`Total routes: ${routes.length}`);
    routes.forEach(route => {
      console.log(`- Route: ${route.routeName}, Company ID: ${route.busCompanyId}`);
    });

    console.log('\n=== BUS TRIPS ===');
    const bustripsCollection = db.collection('bustrips');
    const trips = await bustripsCollection.find({}).toArray();
    console.log(`Total trips: ${trips.length}`);
    trips.forEach(trip => {
      console.log(`- Trip ID: ${trip._id}, Company ID: ${trip.busCompanyId}, Route ID: ${trip.routeId}`);
    });

    console.log('\n=== BUS FLEET ===');
    const busfleetCollection = db.collection('busfleet');
    const fleet = await busfleetCollection.find({}).toArray();
    console.log(`Total fleet: ${fleet.length}`);
    fleet.forEach(bus => {
      console.log(`- Bus: ${bus.busNumber || bus.make || 'Unknown'}, Company ID: ${bus.busCompanyId}`);
    });

    console.log('\n=== BUS FARES ===');
    const busfaresCollection = db.collection('busfares');
    const fares = await busfaresCollection.find({}).toArray();
    console.log(`Total fares: ${fares.length}`);
    fares.forEach(fare => {
      console.log(`- Fare: ${fare.origin} to ${fare.destination} (${fare.fareAmount}), Company ID: ${fare.busCompanyId}`);
    });

    console.log('\n=== BUS BOOKINGS ===');
    const busbookingsCollection = db.collection('busbookings');
    const bookings = await busbookingsCollection.find({}).toArray();
    console.log(`Total bookings: ${bookings.length}`);
    bookings.forEach(booking => {
      console.log(`- Booking: ${booking.passengerName}, Schedule: ${booking.scheduleId}, Fare: ${booking.fare}`);
    });

    // Find unique company IDs
    const companyIds = new Set();
    routes.forEach(r => companyIds.add(r.busCompanyId));
    trips.forEach(t => companyIds.add(t.busCompanyId));
    fleet.forEach(f => companyIds.add(f.busCompanyId));
    fares.forEach(f => companyIds.add(f.busCompanyId));

    console.log('\n=== UNIQUE COMPANY IDs FOUND ===');
    companyIds.forEach(id => {
      console.log(`- Company ID: ${id}`);
    });

    // Check if any of these company IDs match actual users
    console.log('\n=== CHECKING IF COMPANY IDs MATCH USERS ===');
    const usersCollection = db.collection('users');
    for (const companyId of companyIds) {
      const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(companyId) });
      if (user) {
        console.log(`✅ Company ID ${companyId} matches user: ${user.email} (${user.serviceType})`);
      } else {
        console.log(`❌ Company ID ${companyId} does not match any user`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

findRealVendorData();
