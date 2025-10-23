import mongoose from 'mongoose';
import { Loan } from '../src/models/Loan';
import connectDB from '../src/lib/mongodb';

async function checkLoans() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Find all loans
    const loans = await Loan.find({});
    
    console.log(`\nTotal loans in database: ${loans.length}\n`);
    
    if (loans.length > 0) {
      loans.forEach((loan, index) => {
        console.log(`Loan ${index + 1}:`);
        console.log(`  ID: ${loan._id}`);
        console.log(`  Customer: ${loan.customerName} (${loan.customerId})`);
        console.log(`  Institution ID: ${loan.institutionId}`);
        console.log(`  Institution Name: ${loan.institutionName || 'NOT SET'}`);
        console.log(`  Loan Type: ${loan.loanType}`);
        console.log(`  Amount: ZMW ${loan.amount}`);
        console.log(`  Status: ${loan.status}`);
        console.log(`  Application Date: ${loan.applicationDate}`);
        console.log('---');
      });
    } else {
      console.log('No loans found in the database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLoans();

