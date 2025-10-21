import connectDB from '../src/lib/mongodb';
import { Loan } from '../src/models/Loan';
import { Institution } from '../src/models/Institution';
import { User } from '../src/models/User';
import mongoose from 'mongoose';

async function seedCustomerDashboard() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Create test customer if doesn't exist
    const customerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    let customer = await User.findById(customerId);
    
    if (!customer) {
      console.log('Creating test customer...');
      customer = new User({
        _id: customerId,
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        kycStatus: 'verified'
      });
      await customer.save();
      console.log('Test customer created');
    } else {
      console.log('Test customer already exists');
    }

    // Create test institution if doesn't exist
    let institution = await Institution.findOne({ name: 'First National Bank' });
    
    if (!institution) {
      console.log('Creating test institution...');
      institution = new Institution({
        name: 'First National Bank',
        description: 'A leading commercial bank providing comprehensive financial services',
        type: 'Commercial Bank',
        contactEmail: 'contact@fnb.com',
        contactPhone: '+260 211 123456',
        address: '123 Independence Avenue, Lusaka',
        licenseNumber: 'FNB001',
        status: 'active',
        adminUserId: new mongoose.Types.ObjectId().toString(),
        totalCustomers: 0,
        totalLoans: 0,
        totalAssets: 0,
        complianceScore: 95
      });
      await institution.save();
      console.log('Test institution created');
    } else {
      console.log('Test institution already exists');
    }

    // Clear existing loans for this customer
    await Loan.deleteMany({ customerId });
    console.log('Cleared existing loans for test customer');

    // Create sample loans
    const sampleLoans = [
      {
        customerId: customerId,
        institutionId: institution._id,
        institutionName: institution.name,
        loanType: 'Personal Loan',
        amount: 25000,
        interestRate: 12.5,
        termMonths: 24,
        monthlyPayment: 1200,
        remainingBalance: 18000,
        purpose: 'Home improvement',
        applicationDate: new Date('2024-01-15'),
        status: 'recovery',
        riskLevel: 'medium',
        nextPaymentDate: new Date('2024-02-15'),
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '+260 97 123 4567',
        customerAddress: '456 Main Street, Lusaka',
        monthlyIncome: 8000,
        employmentStatus: 'employed',
        employerName: 'ABC Company Ltd',
        employmentDuration: '2_5_years'
      },
      {
        customerId: customerId,
        institutionId: institution._id,
        institutionName: institution.name,
        loanType: 'Business Loan',
        amount: 50000,
        interestRate: 15.0,
        termMonths: 36,
        monthlyPayment: 1800,
        remainingBalance: 45000,
        purpose: 'Business expansion',
        applicationDate: new Date('2023-12-01'),
        status: 'recovery',
        riskLevel: 'high',
        nextPaymentDate: new Date('2024-02-01'),
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '+260 97 123 4567',
        customerAddress: '456 Main Street, Lusaka',
        monthlyIncome: 12000,
        employmentStatus: 'business_owner',
        employerName: 'John Doe Enterprises',
        employmentDuration: 'more_than_5_years'
      },
      {
        customerId: customerId,
        institutionId: institution._id,
        institutionName: institution.name,
        loanType: 'Auto Loan',
        amount: 15000,
        interestRate: 10.0,
        termMonths: 18,
        monthlyPayment: 900,
        remainingBalance: 0,
        purpose: 'Vehicle purchase',
        applicationDate: new Date('2024-01-20'),
        status: 'approved',
        riskLevel: 'low',
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '+260 97 123 4567',
        customerAddress: '456 Main Street, Lusaka',
        monthlyIncome: 8000,
        employmentStatus: 'employed',
        employerName: 'ABC Company Ltd',
        employmentDuration: '2_5_years'
      },
      {
        customerId: customerId,
        institutionId: institution._id,
        institutionName: institution.name,
        loanType: 'Emergency Loan',
        amount: 8000,
        interestRate: 18.0,
        termMonths: 12,
        monthlyPayment: 750,
        remainingBalance: 8000,
        purpose: 'Medical emergency',
        applicationDate: new Date('2024-01-25'),
        status: 'pending_review',
        riskLevel: 'medium',
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '+260 97 123 4567',
        customerAddress: '456 Main Street, Lusaka',
        monthlyIncome: 8000,
        employmentStatus: 'employed',
        employerName: 'ABC Company Ltd',
        employmentDuration: '2_5_years'
      }
    ];

    console.log('Creating sample loans...');
    for (const loanData of sampleLoans) {
      const loan = new Loan(loanData);
      await loan.save();
      console.log(`Created loan: ${loan.loanType} - ZMW ${loan.amount.toLocaleString()}`);
    }

    console.log('Sample data seeded successfully!');
    console.log(`Created ${sampleLoans.length} loans for customer: ${customer.firstName} ${customer.lastName}`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seedCustomerDashboard();
