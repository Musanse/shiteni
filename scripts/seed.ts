import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedDatabase() {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shiteni.com',
      password: adminPassword,
      role: 'super_admin',
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();
    console.log('✅ Admin user created');

    // Create sample vendor users
    const vendorPassword = await bcrypt.hash('vendor123', 12);
    
    // Bus vendor
    const busVendor = new User({
      firstName: 'Bus',
      lastName: 'Company',
      email: 'bus@shiteni.com',
      password: vendorPassword,
      role: 'manager',
      serviceType: 'bus',
      businessName: 'Express Bus Services',
      businessType: 'Transportation',
      businessDescription: 'Reliable bus transportation services',
      businessPhone: '+260 123 456 789',
      businessAddress: 'Lusaka, Zambia',
      city: 'Lusaka',
      country: 'Zambia',
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await busVendor.save();
    console.log('✅ Bus vendor created');

    // Hotel vendor
    const hotelVendor = new User({
      firstName: 'Hotel',
      lastName: 'Manager',
      email: 'hotel@shiteni.com',
      password: vendorPassword,
      role: 'manager',
      serviceType: 'hotel',
      businessName: 'Grand Hotel Lusaka',
      businessType: 'Hospitality',
      businessDescription: 'Luxury hotel accommodation',
      businessPhone: '+260 987 654 321',
      businessAddress: 'Cairo Road, Lusaka',
      city: 'Lusaka',
      country: 'Zambia',
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await hotelVendor.save();
    console.log('✅ Hotel vendor created');

    // Pharmacy vendor
    const pharmacyVendor = new User({
      firstName: 'Pharmacy',
      lastName: 'Owner',
      email: 'pharmacy@shiteni.com',
      password: vendorPassword,
      role: 'manager',
      serviceType: 'pharmacy',
      businessName: 'Health Plus Pharmacy',
      businessType: 'Healthcare',
      businessDescription: 'Complete pharmaceutical services',
      businessPhone: '+260 555 123 456',
      businessAddress: 'Manda Hill, Lusaka',
      city: 'Lusaka',
      country: 'Zambia',
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await pharmacyVendor.save();
    console.log('✅ Pharmacy vendor created');

    // Store vendor
    const storeVendor = new User({
      firstName: 'Store',
      lastName: 'Owner',
      email: 'store@shiteni.com',
      password: vendorPassword,
      role: 'manager',
      serviceType: 'store',
      businessName: 'SuperMart Lusaka',
      businessType: 'Retail',
      businessDescription: 'One-stop shopping destination',
      businessPhone: '+260 777 888 999',
      businessAddress: 'East Park Mall, Lusaka',
      city: 'Lusaka',
      country: 'Zambia',
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await storeVendor.save();
    console.log('✅ Store vendor created');

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@shiteni.com',
      password: customerPassword,
      role: 'customer',
      phone: '+260 111 222 333',
      address: {
        street: '123 Main Street',
        city: 'Lusaka',
        country: 'Zambia'
      },
      kycStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await customer.save();
    console.log('✅ Customer created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Users Created:');
    console.log('Admin: admin@shiteni.com / admin123');
    console.log('Bus Vendor: bus@shiteni.com / vendor123');
    console.log('Hotel Vendor: hotel@shiteni.com / vendor123');
    console.log('Pharmacy Vendor: pharmacy@shiteni.com / vendor123');
    console.log('Store Vendor: store@shiteni.com / vendor123');
    console.log('Customer: customer@shiteni.com / customer123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedDatabase();