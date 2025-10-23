// Script to create sample bus data for testing
const mongoose = require('mongoose');

const createSampleBusData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create sample bus company (user)
    const usersCollection = db.collection('users');
    const sampleBusCompany = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Bus Company',
      email: 'bus@test.com',
      serviceType: 'bus',
      role: 'vendor',
      businessName: 'Test Bus Company',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: 'bus@test.com' });
    let busCompanyId;
    
    if (existingUser) {
      busCompanyId = existingUser._id;
      console.log('Using existing bus company:', existingUser._id);
    } else {
      await usersCollection.insertOne(sampleBusCompany);
      busCompanyId = sampleBusCompany._id;
      console.log('Created new bus company:', busCompanyId);
    }

    // Create sample route
    const busroutesCollection = db.collection('busroutes');
    const sampleRoute = {
      _id: new mongoose.Types.ObjectId(),
      routeName: 'Lusaka to Livingstone',
      stops: [
        { stopId: new mongoose.Types.ObjectId(), stopName: 'Lusaka', order: 0 },
        { stopId: new mongoose.Types.ObjectId(), stopName: 'Mazabuka', order: 1 },
        { stopId: new mongoose.Types.ObjectId(), stopName: 'Kafue', order: 2 },
        { stopId: new mongoose.Types.ObjectId(), stopName: 'Choma', order: 3 },
        { stopId: new mongoose.Types.ObjectId(), stopName: 'Livingstone', order: 4 }
      ],
      fareSegments: [
        { from: 'Lusaka', to: 'Mazabuka', amount: 50 },
        { from: 'Mazabuka', to: 'Kafue', amount: 30 },
        { from: 'Kafue', to: 'Choma', amount: 40 },
        { from: 'Choma', to: 'Livingstone', amount: 60 }
      ],
      totalDistance: 500,
      isBidirectional: true,
      status: 'active',
      busCompanyId: busCompanyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await busroutesCollection.insertOne(sampleRoute);
    console.log('Created sample route:', sampleRoute._id);

    // Create sample bus fleet
    const busfleetCollection = db.collection('busfleet');
    const sampleBus = {
      _id: new mongoose.Types.ObjectId(),
      busNumber: 'BUS-001',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2020,
      capacity: 50,
      numberOfSeats: 50,
      seatTypes: ['Standard'],
      amenities: ['AC', 'WiFi'],
      licensePlate: 'ABC-123',
      insuranceNumber: 'INS-001',
      registrationNumber: 'REG-001',
      status: 'active',
      lastServiceDate: new Date(),
      nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      mileage: 50000,
      driverId: 'driver-001',
      busCompanyId: busCompanyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await busfleetCollection.insertOne(sampleBus);
    console.log('Created sample bus:', sampleBus._id);

    // Create sample trip
    const bustripsCollection = db.collection('bustrips');
    const sampleTrip = {
      _id: new mongoose.Types.ObjectId(),
      routeId: sampleRoute._id,
      busId: sampleBus._id,
      busCompanyId: busCompanyId,
      departureTime: '08:00',
      arrivalTime: '18:00',
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await bustripsCollection.insertOne(sampleTrip);
    console.log('Created sample trip:', sampleTrip._id);

    // Create sample fares
    const busfaresCollection = db.collection('busfares');
    const sampleFares = [
      {
        _id: new mongoose.Types.ObjectId(),
        routeName: 'Lusaka to Livingstone',
        origin: 'Lusaka',
        destination: 'Mazabuka',
        fareAmount: 50,
        currency: 'ZMW',
        discount: 0,
        status: 'active',
        busCompanyId: busCompanyId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        routeName: 'Lusaka to Livingstone',
        origin: 'Mazabuka',
        destination: 'Kafue',
        fareAmount: 30,
        currency: 'ZMW',
        discount: 0,
        status: 'active',
        busCompanyId: busCompanyId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        routeName: 'Lusaka to Livingstone',
        origin: 'Kafue',
        destination: 'Choma',
        fareAmount: 40,
        currency: 'ZMW',
        discount: 0,
        status: 'active',
        busCompanyId: busCompanyId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        routeName: 'Lusaka to Livingstone',
        origin: 'Choma',
        destination: 'Livingstone',
        fareAmount: 60,
        currency: 'ZMW',
        discount: 0,
        status: 'active',
        busCompanyId: busCompanyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await busfaresCollection.insertMany(sampleFares);
    console.log('Created sample fares:', sampleFares.length);

    console.log('✅ Sample bus data created successfully!');
    console.log('Bus Company ID:', busCompanyId);
    console.log('Route ID:', sampleRoute._id);
    console.log('Bus ID:', sampleBus._id);
    console.log('Trip ID:', sampleTrip._id);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createSampleBusData();
