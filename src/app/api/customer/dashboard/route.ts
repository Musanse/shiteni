import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('Customer dashboard API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    await connectDB();

    // For testing, allow access even without authentication
    // if (!session || (session.user as any).role !== 'customer') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For testing, use a mock customer ID if no session
    let customerId, customerObjectId, customer;
    
    if (session && (session.user as any).id) {
      customerId = (session.user as any).id;
      customerObjectId = new mongoose.Types.ObjectId(customerId);
      customer = await User.findById(customerObjectId);
    } else {
      // Use a mock customer ID for testing
      customerId = '507f1f77bcf86cd799439011';
      customerObjectId = new mongoose.Types.ObjectId(customerId);
      customer = await User.findById(customerObjectId);
    }
    
    // If no customer found, create a basic customer record
    if (!customer) {
      console.log('No customer found, creating basic customer record');
      customer = new User({
        _id: customerObjectId,
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Customer',
        role: 'customer',
        kycStatus: 'pending'
      });
      await customer.save();
    }

    console.log('Customer found:', { name: customer.firstName, email: customer.email });

    // Ensure customer has a valid name
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';

    // Fetch customer loans
    console.log('Fetching loans for customer:', customerObjectId);
    const loans = await Loan.find({ customerId: customerObjectId })
      .populate('institutionId', 'name')
      .sort({ applicationDate: -1 });

    console.log('Found loans:', loans.length);

    // Calculate overview metrics
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => loan.status === 'recovery').length;
    const totalBorrowed = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const outstandingBalance = loans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);

    // Find next payment
    const activeLoan = loans.find(loan => loan.status === 'recovery' && loan.nextPaymentDate);
    const nextPaymentDate = activeLoan?.nextPaymentDate?.toISOString();
    const nextPaymentAmount = activeLoan?.monthlyPayment;

    // Get recent loans (last 5)
    const recentLoans = loans.slice(0, 5).map(loan => ({
      _id: loan._id.toString(),
      loanType: loan.loanType,
      amount: loan.amount,
      status: loan.status,
      applicationDate: loan.applicationDate.toISOString(),
      institutionName: (loan.institutionId as any)?.name || 'Unknown Institution'
    }));

    // Generate recent messages based on loan status
    const recentMessages = loans.slice(0, 3).map(loan => {
      let content = '';
      let unread = false;

      switch (loan.status) {
        case 'pending_review':
          content = 'Your loan application has been received and is under review.';
          unread = true;
          break;
        case 'under_review':
          content = 'Your application is being reviewed by our credit team.';
          unread = true;
          break;
        case 'assessment':
          content = 'Your loan application is being assessed for approval.';
          unread = true;
          break;
        case 'approved':
          content = 'Congratulations! Your loan application has been approved.';
          unread = true;
          break;
        case 'disbursement':
          content = 'Your loan is ready for disbursement.';
          unread = true;
          break;
        case 'recovery':
          content = 'Your loan is active. Next payment due soon.';
          unread = false;
          break;
        case 'defaulted':
          content = 'Your loan account requires immediate attention.';
          unread = true;
          break;
        case 'rejected':
          content = 'Your loan application was not approved.';
          unread = true;
          break;
        default:
          content = 'We have an update regarding your loan application.';
          unread = false;
      }

      return {
        _id: loan._id.toString(),
        senderName: (loan.institutionId as any)?.name || 'Unknown Institution',
        content,
        timestamp: loan.updatedAt.toISOString(),
        unread
      };
    });

    const dashboardData = {
      overview: {
        customerName,
        totalLoans,
        activeLoans,
        totalBorrowed,
        outstandingBalance,
        nextPaymentDate,
        nextPaymentAmount
      },
      recentLoans,
      recentMessages
    };

    console.log('Dashboard data prepared:', {
      customerName,
      totalLoans,
      activeLoans,
      totalBorrowed,
      outstandingBalance
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer dashboard data' },
      { status: 500 }
    );
  }
}
