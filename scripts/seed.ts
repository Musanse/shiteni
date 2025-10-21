import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Institution } from '@/models/Institution';
import { LoanProduct } from '@/models/LoanProduct';

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
      email: 'admin@mankuca.com',
      password: adminPassword,
      role: 'admin',
      kycStatus: 'verified',
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create institution admin
    const institutionPassword = await bcrypt.hash('institution123', 12);
    const institutionAdmin = new User({
      firstName: 'Bank',
      lastName: 'Manager',
      email: 'manager@firstbank.com',
      password: institutionPassword,
      role: 'institution',
      kycStatus: 'verified',
    });
    await institutionAdmin.save();
    console.log('✅ Institution admin created');

    // Create institution
    const institution = new Institution({
      name: 'First National Bank',
      description: 'A leading financial institution providing comprehensive banking services',
      licenseNumber: 'FNB-2024-001',
      contactEmail: 'info@firstbank.com',
      contactPhone: '+1-555-0123',
      address: {
        street: '123 Financial District',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      status: 'approved',
      adminUserId: institutionAdmin._id.toString(),
      staffUsers: [],
      loanProducts: [],
    });
    await institution.save();
    console.log('✅ Institution created');

    // Create loan products
    const personalLoan = new LoanProduct({
      institutionId: institution._id.toString(),
      name: 'Personal Loan',
      description: 'Flexible personal loan for various needs',
      minAmount: 1000,
      maxAmount: 50000,
      interestRate: 8.5,
      termMonths: 36,
      requirements: {
        minCreditScore: 650,
        minIncome: 30000,
        employmentDuration: 12,
        documents: ['id', 'income_proof', 'bank_statement'],
      },
      isActive: true,
    });
    await personalLoan.save();

    const homeLoan = new LoanProduct({
      institutionId: institution._id.toString(),
      name: 'Home Loan',
      description: 'Competitive rates for home purchases',
      minAmount: 50000,
      maxAmount: 500000,
      interestRate: 6.2,
      termMonths: 240,
      requirements: {
        minCreditScore: 700,
        minIncome: 50000,
        employmentDuration: 24,
        documents: ['id', 'income_proof', 'bank_statement', 'property_documents'],
      },
      isActive: true,
    });
    await homeLoan.save();
    console.log('✅ Loan products created');

    // Create customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      password: customerPassword,
      role: 'customer',
      phone: '+1-555-0456',
      kycStatus: 'verified',
      address: {
        street: '456 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
      },
    });
    await customer.save();
    console.log('✅ Customer created');

    // Update institution with loan products
    institution.loanProducts = [personalLoan._id.toString(), homeLoan._id.toString()];
    await institution.save();

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Demo accounts created:');
    console.log('👤 Admin: admin@mankuca.com / admin123');
    console.log('🏦 Institution: manager@firstbank.com / institution123');
    console.log('👤 Customer: john.doe@email.com / customer123');
    console.log('');
    console.log('You can now start the application and test with these accounts.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
