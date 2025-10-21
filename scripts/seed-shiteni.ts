import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { HotelRoom, HotelBooking, HotelGuest } from '../src/models/Hotel';
import { StoreProduct, StoreOrder, StoreCustomer } from '../src/models/Store';
import { PharmacyMedicine, PharmacyPrescription, PharmacyPatient } from '../src/models/Pharmacy';
import { BusRoute, BusSchedule, BusBooking, BusFleet, BusPassenger } from '../src/models/Bus';
import bcrypt from 'bcryptjs';

async function seedShiteni() {
  try {
    console.log('🌱 Starting Shiteni database seeding...');
    
    // MongoDB connection string
    const MONGODB_URI = 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await HotelRoom.deleteMany({});
    await HotelBooking.deleteMany({});
    await HotelGuest.deleteMany({});
    await StoreProduct.deleteMany({});
    await StoreOrder.deleteMany({});
    await StoreCustomer.deleteMany({});
    await PharmacyMedicine.deleteMany({});
    await PharmacyPrescription.deleteMany({});
    await PharmacyPatient.deleteMany({});
    await BusRoute.deleteMany({});
    await BusSchedule.deleteMany({});
    await BusBooking.deleteMany({});
    await BusFleet.deleteMany({});
    await BusPassenger.deleteMany({});

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = new User({
      email: 'admin@shiteni.com',
      password: await bcrypt.hash('admin123', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      phone: '+1234567890',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'Admin Country'
      },
      kycStatus: 'verified',
      emailVerified: true,
      status: 'active'
    });
    await superAdmin.save();
    console.log('✅ Super Admin created');

    // Create Hotel Manager
    console.log('🏨 Creating Hotel Manager...');
    const hotelAdmin = new User({
      email: 'manager@luxuryhotel.com',
      password: await bcrypt.hash('hotel123', 12),
      firstName: 'Hotel',
      lastName: 'Manager',
      role: 'manager',
      phone: '+1234567891',
      address: {
        street: '456 Hotel Avenue',
        city: 'Hotel City',
        state: 'Hotel State',
        zipCode: '54321',
        country: 'Hotel Country'
      },
      kycStatus: 'verified',
      emailVerified: true,
      status: 'active'
    });
    await hotelAdmin.save();

    // Create Hotel Rooms
    const hotelRooms = [];
    for (let i = 1; i <= 100; i++) {
      const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const floor = Math.floor((i - 1) / 10) + 1;
      const pricePerNight = roomType === 'Standard' ? 150 : 
                           roomType === 'Deluxe' ? 250 : 
                           roomType === 'Suite' ? 400 : 800;

      const room = new HotelRoom({
        roomNumber: `${floor}${String(i % 10).padStart(2, '0')}`,
        roomType,
        floor,
        capacity: roomType === 'Presidential' ? 6 : roomType === 'Suite' ? 4 : 2,
        amenities: ['WiFi', 'TV', 'Mini Bar', 'Room Service'],
        pricePerNight,
        status: Math.random() > 0.7 ? 'occupied' : 'available',
        description: `Beautiful ${roomType.toLowerCase()} room with modern amenities`,
        images: []
      });
      await room.save();
      hotelRooms.push(room);
    }
    console.log(`✅ Created ${hotelRooms.length} hotel rooms`);

    // Create Store Owner
    console.log('🛒 Creating Store Owner...');
    const storeAdmin = new User({
      email: 'owner@techstore.com',
      password: await bcrypt.hash('store123', 12),
      firstName: 'Store',
      lastName: 'Owner',
      role: 'manager',
      phone: '+1234567892',
      address: {
        street: '789 Store Street',
        city: 'Store City',
        state: 'Store State',
        zipCode: '67890',
        country: 'Store Country'
      },
      kycStatus: 'verified',
      emailVerified: true,
      status: 'active'
    });
    await storeAdmin.save();

    // Create Store Products
    const storeProducts = [];
    const productCategories = ['Electronics', 'Computers', 'Mobile', 'Accessories'];
    const productNames = [
      'iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Pro M3', 'Dell XPS 13',
      'AirPods Pro', 'Sony WH-1000XM5', 'iPad Air', 'Surface Laptop',
      'Nintendo Switch', 'PlayStation 5', 'Xbox Series X', 'Steam Deck'
    ];

    for (let i = 0; i < 50; i++) {
      const category = productCategories[Math.floor(Math.random() * productCategories.length)];
      const name = productNames[Math.floor(Math.random() * productNames.length)];
      const price = Math.floor(Math.random() * 1000) + 50;
      const cost = Math.floor(price * 0.7);
      const stock = Math.floor(Math.random() * 100) + 10;

      const product = new StoreProduct({
        name: `${name} ${i + 1}`,
        description: `High-quality ${name.toLowerCase()} with latest features`,
        category,
        subcategory: 'General',
        sku: `TS-${String(i + 1).padStart(3, '0')}`,
        price,
        originalPrice: Math.random() > 0.7 ? price + Math.floor(Math.random() * 100) : undefined,
        cost,
        stock,
        minStock: 5,
        maxStock: 200,
        images: [],
        imageUrl: `/placeholder-product.jpg`,
        specifications: {
          brand: 'TechStore',
          model: `${name} ${i + 1}`,
          warranty: '1 Year'
        },
        tags: [category, 'Popular', 'New'],
        status: 'active',
        featured: Math.random() > 0.8,
        rating: Math.random() * 5,
        reviewCount: Math.floor(Math.random() * 1000),
        supplier: 'TechStore Global',
        supplierLocation: ['China', 'USA', 'Germany', 'Japan'][Math.floor(Math.random() * 4)],
        minOrderQuantity: Math.floor(Math.random() * 10) + 1,
        isVerified: Math.random() > 0.3
      });
      await product.save();
      storeProducts.push(product);
    }
    console.log(`✅ Created ${storeProducts.length} store products`);

    // Create Pharmacy Manager
    console.log('💊 Creating Pharmacy Manager...');
    const pharmacyAdmin = new User({
      email: 'pharmacist@medpharmacy.com',
      password: await bcrypt.hash('pharmacy123', 12),
      firstName: 'Pharmacy',
      lastName: 'Manager',
      role: 'manager',
      phone: '+1234567893',
      address: {
        street: '321 Pharmacy Lane',
        city: 'Pharmacy City',
        state: 'Pharmacy State',
        zipCode: '13579',
        country: 'Pharmacy Country'
      },
      kycStatus: 'verified',
      emailVerified: true,
      status: 'active'
    });
    await pharmacyAdmin.save();

    // Create Pharmacy Medicines
    const pharmacyMedicines = [];
    const medicineNames = [
      'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Metformin',
      'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Levothyroxine', 'Metoprolol'
    ];

    for (let i = 0; i < 30; i++) {
      const name = medicineNames[Math.floor(Math.random() * medicineNames.length)];
      const price = Math.floor(Math.random() * 50) + 5;
      const cost = Math.floor(price * 0.6);
      const stock = Math.floor(Math.random() * 200) + 20;

      const medicine = new PharmacyMedicine({
        name: `${name} ${i + 1}`,
        genericName: name,
        brandName: `MedPharm ${name}`,
        category: 'General Medicine',
        dosage: '500mg',
        form: 'Tablet',
        strength: '500mg',
        manufacturer: 'MedPharm Pharmaceuticals',
        batchNumber: `MP-${String(i + 1).padStart(3, '0')}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        stock,
        minStock: 10,
        maxStock: 500,
        cost,
        sellingPrice: price,
        prescriptionRequired: Math.random() > 0.5,
        controlledSubstance: Math.random() > 0.8,
        sideEffects: ['Nausea', 'Dizziness'],
        contraindications: ['Pregnancy', 'Liver Disease'],
        interactions: ['Alcohol', 'Other Medications'],
        images: [],
        status: 'active'
      });
      await medicine.save();
      pharmacyMedicines.push(medicine);
    }
    console.log(`✅ Created ${pharmacyMedicines.length} pharmacy medicines`);

    // Create Bus Operator
    console.log('🚌 Creating Bus Operator...');
    const busAdmin = new User({
      email: 'operator@citybus.com',
      password: await bcrypt.hash('bus123', 12),
      firstName: 'Bus',
      lastName: 'Operator',
      role: 'manager',
      phone: '+1234567894',
      address: {
        street: '654 Bus Terminal',
        city: 'Bus City',
        state: 'Bus State',
        zipCode: '24680',
        country: 'Bus Country'
      },
      kycStatus: 'verified',
      emailVerified: true,
      status: 'active'
    });
    await busAdmin.save();

    // Create Bus Routes
    const busRoutes = [];
    const routeNames = [
      'Downtown Express', 'Airport Shuttle', 'University Line', 'Suburban Route',
      'City Center Loop', 'Industrial Zone', 'Shopping District', 'Residential Area'
    ];

    for (let i = 0; i < 15; i++) {
      const routeName = routeNames[Math.floor(Math.random() * routeNames.length)];
      const fare = Math.floor(Math.random() * 20) + 5;

      const route = new BusRoute({
        routeName: `${routeName} ${i + 1}`,
        routeNumber: `CB-${String(i + 1).padStart(3, '0')}`,
        origin: `Stop ${i + 1}`,
        destination: `Destination ${i + 1}`,
        distance: Math.floor(Math.random() * 50) + 10,
        duration: Math.floor(Math.random() * 120) + 30,
        stops: [
          {
            name: `Stop ${i + 1}`,
            address: `${i + 1} Main Street`,
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
            arrivalTime: '08:00',
            departureTime: '08:05'
          },
          {
            name: `Destination ${i + 1}`,
            address: `${i + 1} Destination Avenue`,
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
            arrivalTime: '09:00',
            departureTime: '09:05'
          }
        ],
        fare,
        status: 'active'
      });
      await route.save();
      busRoutes.push(route);
    }
    console.log(`✅ Created ${busRoutes.length} bus routes`);

    // Create Bus Fleet
    const busFleet = [];
    for (let i = 1; i <= 25; i++) {
      const bus = new BusFleet({
        busNumber: `CB-${String(i).padStart(3, '0')}`,
        make: 'Volvo',
        model: 'B12M',
        year: 2020 + Math.floor(Math.random() * 4),
        capacity: 50,
        seatTypes: ['Standard', 'Premium'],
        amenities: ['WiFi', 'AC', 'USB Charging', 'Reclining Seats'],
        licensePlate: `BUS-${String(i).padStart(3, '0')}`,
        insuranceNumber: `INS-${String(i).padStart(3, '0')}`,
        registrationNumber: `REG-${String(i).padStart(3, '0')}`,
        status: Math.random() > 0.1 ? 'active' : 'maintenance',
        lastServiceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextServiceDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        mileage: Math.floor(Math.random() * 100000) + 50000
      });
      await bus.save();
      busFleet.push(bus);
    }
    console.log(`✅ Created ${busFleet.length} buses in fleet`);

    console.log('🎉 Shiteni database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👑 Super Admin: admin@shiteni.com / admin123`);
    console.log(`   🏨 Hotel Manager: manager@luxuryhotel.com / hotel123`);
    console.log(`   🛒 Store Owner: owner@techstore.com / store123`);
    console.log(`   💊 Pharmacy Manager: pharmacist@medpharmacy.com / pharmacy123`);
    console.log(`   🚌 Bus Operator: operator@citybus.com / bus123`);
    console.log(`   📁 Total Collections: 15+ collections created`);
    console.log(`   👥 Total Users: 5 users created`);
    console.log(`   📦 Total Records: 200+ records created`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedShiteni();
