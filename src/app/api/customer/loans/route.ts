import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For testing, allow access even without authentication
    // if (!session || (session.user as any).role !== 'customer') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    // For testing, use mock customer data if no session
    let customerObjectId;
    
    if (session && (session.user as any).id) {
      const customerId = (session.user as any).id;
      customerObjectId = new mongoose.Types.ObjectId(customerId);
    } else {
      // Use mock ObjectId for testing
      customerObjectId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    }

    // Fetch loans for this customer
    const loans = await Loan.find({ customerId: customerObjectId })
      .sort({ applicationDate: -1 });

    const formattedLoans = loans.map(loan => ({
      _id: loan._id.toString(),
      customerId: loan.customerId,
      customerName: loan.customerName,
      customerEmail: loan.customerEmail,
      customerPhone: loan.customerPhone,
      customerAddress: loan.customerAddress,
      customerCity: loan.customerCity,
      customerCountry: loan.customerCountry,
      dateOfBirth: loan.dateOfBirth,
      occupation: loan.occupation,
      loanType: loan.loanType,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      status: loan.status,
      applicationDate: loan.applicationDate.toISOString(),
      approvalDate: loan.approvalDate?.toISOString(),
      disbursementDate: loan.disbursementDate?.toISOString(),
      monthlyPayment: loan.monthlyPayment,
      remainingBalance: loan.remainingBalance,
      nextPaymentDate: loan.nextPaymentDate?.toISOString(),
      institutionName: loan.institutionName || 'Unknown Institution',
      riskLevel: loan.riskLevel,
      purpose: loan.purpose,
      monthlyIncome: loan.monthlyIncome,
      employmentStatus: loan.employmentStatus,
      employerName: loan.employerName,
      employmentDuration: loan.employmentDuration,
      reference1Name: loan.reference1Name,
      reference1Phone: loan.reference1Phone,
      reference1Relationship: loan.reference1Relationship,
      reference2Name: loan.reference2Name,
      reference2Phone: loan.reference2Phone,
      reference2Relationship: loan.reference2Relationship,
      guarantorName: loan.guarantorName,
      guarantorPhone: loan.guarantorPhone,
      guarantorEmail: loan.guarantorEmail,
      guarantorAddress: loan.guarantorAddress,
      guarantorRelationship: loan.guarantorRelationship,
      guarantorMonthlyIncome: loan.guarantorMonthlyIncome,
      guarantor: loan.guarantor,
      documents: loan.documents
    }));

    return NextResponse.json({ loans: formattedLoans });
  } catch (error) {
    console.error('Error fetching customer loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer loans' },
      { status: 500 }
    );
  }
}
