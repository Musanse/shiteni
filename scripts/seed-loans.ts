import connectDB from '../src/lib/mongodb';
import { Loan } from '../src/models/Loan';
import { User } from '../src/models/User';
import { Institution } from '../src/models/Institution';

async function seedLoans() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing loans
    await Loan.deleteMany({});
    console.log('Cleared existing loans');

    // Get sample users and institutions
    const users = await User.find({ role: 'customer' }).limit(20);
    const institutions = await Institution.find({}).limit(5);

    // If no institutions exist, create some sample ones
    if (institutions.length === 0) {
      console.log('No institutions found, creating sample institutions...');
      const sampleInstitutions = [
        {
          name: 'First National Bank',
          description: 'A leading commercial bank providing comprehensive financial services',
          type: 'Commercial Bank',
          licenseNumber: 'BNK001',
          contactEmail: 'contact@firstnational.com',
          contactPhone: '+1-555-0101',
          address: '123 Main Street, New York, NY 10001',
          status: 'active',
          adminUserId: 'admin@mankuca.com',
          staffUsers: [],
          loanProducts: ['personal', 'business', 'mortgage'],
          documents: ['license.pdf', 'registration.pdf'],
          registrationDate: new Date(),
          approvedAt: new Date(),
          approvedBy: 'admin@mankuca.com',
          totalCustomers: 15000,
          totalLoans: 2500,
          totalAssets: 5000000000,
          complianceScore: 95,
          lastAudit: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Community Credit Union',
          description: 'A member-owned financial cooperative serving the local community',
          type: 'Credit Union',
          licenseNumber: 'CU001',
          contactEmail: 'info@communitycu.org',
          contactPhone: '+1-555-0102',
          address: '456 Oak Avenue, Chicago, IL 60601',
          status: 'active',
          adminUserId: 'admin@mankuca.com',
          staffUsers: [],
          loanProducts: ['personal', 'auto', 'mortgage'],
          documents: ['license.pdf', 'registration.pdf'],
          registrationDate: new Date(),
          approvedAt: new Date(),
          approvedBy: 'admin@mankuca.com',
          totalCustomers: 8500,
          totalLoans: 1200,
          totalAssets: 1200000000,
          complianceScore: 88,
          lastAudit: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Metro Microfinance',
          description: 'Providing microfinance services to underserved communities',
          type: 'Microfinance Institution',
          licenseNumber: 'MFI001',
          contactEmail: 'support@metrofinance.com',
          contactPhone: '+1-555-0103',
          address: '789 Pine Street, Los Angeles, CA 90210',
          status: 'active',
          adminUserId: 'admin@mankuca.com',
          staffUsers: [],
          loanProducts: ['personal', 'business', 'emergency'],
          documents: ['license.pdf', 'registration.pdf'],
          registrationDate: new Date(),
          approvedAt: new Date(),
          approvedBy: 'admin@mankuca.com',
          totalCustomers: 5000,
          totalLoans: 800,
          totalAssets: 500000000,
          complianceScore: 82,
          lastAudit: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await Institution.insertMany(sampleInstitutions);
      console.log(`Created ${sampleInstitutions.length} sample institutions`);
    }

    // Get updated institutions list
    const updatedInstitutions = await Institution.find({}).limit(5);

    // If no customer users exist, create some sample ones
    if (users.length === 0) {
      console.log('No customer users found, creating sample customers...');
      const sampleCustomers = [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          password: '$2a$10$rQZ8K9vX8K9vX8K9vX8K9u', // hashed password
          role: 'customer',
          phone: '+1-555-1001',
          address: {
            street: '100 Customer St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          password: '$2a$10$rQZ8K9vX8K9vX8K9vX8K9u',
          role: 'customer',
          phone: '+1-555-1002',
          address: {
            street: '200 Customer Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA'
          },
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael.brown@email.com',
          password: '$2a$10$rQZ8K9vX8K9vX8K9vX8K9u',
          role: 'customer',
          phone: '+1-555-1003',
          address: {
            street: '300 Customer Blvd',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@email.com',
          password: '$2a$10$rQZ8K9vX8K9vX8K9vX8K9u',
          role: 'customer',
          phone: '+1-555-1004',
          address: {
            street: '400 Customer Dr',
            city: 'Miami',
            state: 'FL',
            zipCode: '33101',
            country: 'USA'
          },
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@email.com',
          password: '$2a$10$rQZ8K9vX8K9vX8K9vX8K9u',
          role: 'customer',
          phone: '+1-555-1005',
          address: {
            street: '500 Customer Ln',
            city: 'Seattle',
            state: 'WA',
            zipCode: '98101',
            country: 'USA'
          },
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await User.insertMany(sampleCustomers);
      console.log(`Created ${sampleCustomers.length} sample customers`);
    }

    // Get updated users list
    const updatedUsers = await User.find({ role: 'customer' }).limit(20);
    const finalInstitutions = await Institution.find({}).limit(5);

    if (updatedUsers.length === 0 || finalInstitutions.length === 0) {
      console.log('Still no users or institutions found. Please check your database.');
      return;
    }

    const loanTypes = ['personal', 'business', 'mortgage', 'auto', 'education', 'emergency'];
    const statuses = ['pending', 'approved', 'active', 'completed', 'defaulted', 'cancelled'];
    const riskLevels = ['low', 'medium', 'high'];
    const purposes = [
      'Home Purchase',
      'Business Expansion',
      'Debt Consolidation',
      'Education',
      'Medical Expenses',
      'Vehicle Purchase',
      'Home Renovation',
      'Emergency Fund',
      'Investment',
      'Wedding'
    ];

    const sampleLoans = [];

    for (let i = 0; i < 100; i++) {
      const user = updatedUsers[Math.floor(Math.random() * updatedUsers.length)];
      const institution = finalInstitutions[Math.floor(Math.random() * finalInstitutions.length)];
      const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const purpose = purposes[Math.floor(Math.random() * purposes.length)];

      // Generate realistic loan amounts based on type (in ZMW)
      let amount: number;
      switch (loanType) {
        case 'mortgage':
          amount = Math.floor(Math.random() * 500000) + 100000; // ZMW 100k - 600k
          break;
        case 'business':
          amount = Math.floor(Math.random() * 200000) + 10000; // ZMW 10k - 210k
          break;
        case 'auto':
          amount = Math.floor(Math.random() * 50000) + 5000; // ZMW 5k - 55k
          break;
        case 'education':
          amount = Math.floor(Math.random() * 100000) + 5000; // ZMW 5k - 105k
          break;
        default:
          amount = Math.floor(Math.random() * 50000) + 1000; // ZMW 1k - 51k
      }

      const interestRate = Math.random() * 15 + 3; // 3% - 18%
      const termMonths = Math.floor(Math.random() * 60) + 12; // 12 - 72 months
      const monthlyPayment = (amount * (interestRate / 100 / 12)) / (1 - Math.pow(1 + (interestRate / 100 / 12), -termMonths));
      const creditScore = Math.floor(Math.random() * 400) + 300; // 300 - 700

      const applicationDate = new Date();
      applicationDate.setDate(applicationDate.getDate() - Math.floor(Math.random() * 365)); // Random date within last year

      let approvalDate: Date | undefined;
      let disbursementDate: Date | undefined;
      let maturityDate: Date | undefined;

      if (['approved', 'active', 'completed', 'defaulted'].includes(status)) {
        approvalDate = new Date(applicationDate);
        approvalDate.setDate(approvalDate.getDate() + Math.floor(Math.random() * 30) + 1);
      }

      if (['active', 'completed', 'defaulted'].includes(status)) {
        disbursementDate = new Date(approvalDate!);
        disbursementDate.setDate(disbursementDate.getDate() + Math.floor(Math.random() * 14) + 1);
      }

      if (['active', 'completed', 'defaulted'].includes(status)) {
        maturityDate = new Date(disbursementDate!);
        maturityDate.setMonth(maturityDate.getMonth() + termMonths);
      }

      const remainingBalance = status === 'completed' ? 0 : 
                              status === 'defaulted' ? Math.floor(Math.random() * amount) :
                              amount - (Math.floor(Math.random() * amount * 0.8));

      const loan = {
        customerId: user._id.toString(),
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        institutionId: institution._id.toString(),
        institutionName: institution.name,
        loanType,
        amount,
        interestRate: Math.round(interestRate * 100) / 100,
        termMonths,
        status,
        applicationDate,
        approvalDate,
        disbursementDate,
        maturityDate,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        creditScore,
        riskLevel,
        purpose,
        collateral: Math.random() > 0.7 ? {
          type: ['Property', 'Vehicle', 'Equipment', 'Savings'][Math.floor(Math.random() * 4)],
          value: Math.floor(Math.random() * amount * 1.5) + amount * 0.5,
          description: 'Collateral description'
        } : undefined,
        guarantor: Math.random() > 0.8 ? {
          name: `Guarantor ${i + 1}`,
          relationship: ['Spouse', 'Parent', 'Sibling', 'Friend'][Math.floor(Math.random() * 4)],
          contact: `guarantor${i + 1}@example.com`
        } : undefined,
        documents: [`loan_application_${i + 1}.pdf`, `income_proof_${i + 1}.pdf`],
        notes: `Loan application notes for ${user.name}`
      };

      sampleLoans.push(loan);
    }

    await Loan.insertMany(sampleLoans);
    console.log(`Seeded ${sampleLoans.length} loans successfully`);

    // Print summary
    const summary = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          averageCreditScore: { $avg: '$creditScore' },
          pendingLoans: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedLoans: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          activeLoans: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completedLoans: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          defaultedLoans: { $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] } },
          lowRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } },
          mediumRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
          highRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } }
        }
      }
    ]);

    console.log('\nLoan Summary:');
    console.log('==============');
    console.log(`Total Loans: ${summary[0]?.totalLoans || 0}`);
    console.log(`Total Amount: ZMW ${(summary[0]?.totalAmount || 0).toLocaleString()}`);
    console.log(`Average Amount: ZMW ${(summary[0]?.averageAmount || 0).toLocaleString()}`);
    console.log(`Average Credit Score: ${Math.round(summary[0]?.averageCreditScore || 0)}`);
    console.log(`\nStatus Breakdown:`);
    console.log(`- Pending: ${summary[0]?.pendingLoans || 0}`);
    console.log(`- Approved: ${summary[0]?.approvedLoans || 0}`);
    console.log(`- Active: ${summary[0]?.activeLoans || 0}`);
    console.log(`- Completed: ${summary[0]?.completedLoans || 0}`);
    console.log(`- Defaulted: ${summary[0]?.defaultedLoans || 0}`);
    console.log(`\nRisk Breakdown:`);
    console.log(`- Low Risk: ${summary[0]?.lowRiskLoans || 0}`);
    console.log(`- Medium Risk: ${summary[0]?.mediumRiskLoans || 0}`);
    console.log(`- High Risk: ${summary[0]?.highRiskLoans || 0}`);

  } catch (error) {
    console.error('Error seeding loans:', error);
  } finally {
    process.exit(0);
  }
}

seedLoans();
