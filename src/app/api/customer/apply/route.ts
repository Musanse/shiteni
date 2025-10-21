import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';

export async function GET() {
  return NextResponse.json({ 
    message: 'Customer apply API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/customer/apply - Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');

    if (!session || (session.user as any).role !== 'customer') {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      loanType,
      amount,
      termMonths,
      purpose,
      monthlyIncome,
      employmentStatus,
      employerName,
      employmentDuration,
      reference1Name,
      reference1Phone,
      reference1Relationship,
      reference2Name,
      reference2Phone,
      reference2Relationship,
      guarantorName,
      guarantorPhone,
      guarantorEmail,
      guarantorAddress,
      guarantorRelationship,
      guarantorMonthlyIncome,
      institutionId,
      institutionName,
      interestRate,
      monthlyPayment,
      documents
    } = body;

    // Validate required fields
    if (!customerId || !customerName || !customerEmail || !loanType || !amount || !termMonths) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerId, customerName, customerEmail, loanType, amount, termMonths' 
      }, { status: 400 });
    }

    // Validate amount and term against product limits
    const product = await Product.findOne({ 
      institutionId: new mongoose.Types.ObjectId(institutionId),
      type: loanType,
      status: 'active'
    });

    if (product) {
      if (amount < product.minAmount || amount > product.maxAmount) {
        return NextResponse.json({ 
          error: `Amount must be between ZMW ${product.minAmount.toLocaleString()} and ZMW ${product.maxAmount.toLocaleString()}` 
        }, { status: 400 });
      }

      if (termMonths < product.minTermMonths || termMonths > product.maxTermMonths) {
        return NextResponse.json({ 
          error: `Term must be between ${product.minTermMonths} and ${product.maxTermMonths} months` 
        }, { status: 400 });
      }
    }

    // Get institution name from database or use provided one
    // const institution = await Institution.findById(institutionId);
    const finalInstitutionName = institution?.name || institutionName || 'Unknown Institution';
    
    if (!institution && !institutionName) {
      console.warn('Institution not found in database and no institutionName provided');
    }

    console.log('Creating loan application with data:', {
      customerId: (session.user as any).id,
      institutionId,
      institutionName: finalInstitutionName,
      loanType,
      amount,
      documents
    });

    // Create loan application
    const loanApplication = new Loan({
      customerId: (session.user as any).id,
      institutionId: institutionId,
      institutionName: finalInstitutionName,
      loanType: String(loanType), // Ensure string type
      amount: Number(amount), // Ensure number type
      interestRate: Number(interestRate) || 8.5,
      termMonths: Number(termMonths),
      monthlyPayment: Number(monthlyPayment) || 0,
      purpose: String(purpose || ''),
      applicationDate: new Date(),
      status: 'pending_review',
      riskLevel: 'medium',
      remainingBalance: Number(amount), // Initial remaining balance is the full amount
      
      // Customer information (KYC)
      customerName: String(customerName || ''),
      customerEmail: String(customerEmail || ''),
      customerPhone: String(customerPhone || ''),
      customerAddress: String(customerAddress || ''),
      
      // Financial information
      monthlyIncome: Number(monthlyIncome) || 0,
      employmentStatus: String(employmentStatus || ''),
      employerName: String(employerName || ''),
      employmentDuration: String(employmentDuration || ''),
      
      // References
      reference1Name: String(reference1Name || ''),
      reference1Phone: String(reference1Phone || ''),
      reference1Relationship: String(reference1Relationship || ''),
      reference2Name: String(reference2Name || ''),
      reference2Phone: String(reference2Phone || ''),
      reference2Relationship: String(reference2Relationship || ''),
      
      // Guarantor information (both individual fields and nested object)
      guarantorName: String(guarantorName || ''),
      guarantorPhone: String(guarantorPhone || ''),
      guarantorEmail: String(guarantorEmail || ''),
      guarantorAddress: String(guarantorAddress || ''),
      guarantorRelationship: String(guarantorRelationship || ''),
      guarantorMonthlyIncome: Number(guarantorMonthlyIncome) || 0,
      guarantor: {
        name: String(guarantorName || ''),
        relationship: String(guarantorRelationship || ''),
        contact: String(guarantorPhone || '')
      },
      
      // Documents
      documents: documents || {}
    });

    console.log('Loan application object created:', {
      customerId: loanApplication.customerId,
      institutionId: loanApplication.institutionId,
      institutionName: loanApplication.institutionName,
      loanType: loanApplication.loanType,
      amount: loanApplication.amount,
      status: loanApplication.status
    });

    await loanApplication.save();
    
    console.log('Loan application saved successfully. Verifying institutionName:', loanApplication.institutionName);

    // Create initial conversation message in Message collection
    try {
      const Message = (await import('@/models/Message')).Message;
      const User = (await import('@/models/User')).User;
      
      // Get institution admin email
      // const institution = await Institution.findById(institutionId);
      const institutionUser = null; // institution ? await User.findById(institution.adminUserId) : null;
      const recipientEmail = institutionUser?.email || institutionId;
      
      // Create initial message from institution to customer
      await Message.create({
        senderId: recipientEmail,
        senderName: finalInstitutionName,
        senderRole: 'institution',
        recipientId: (session.user as any).email,
        recipientName: String(customerName),
        recipientRole: 'customer',
        conversationId: loanApplication._id.toString(),
        messageType: 'text',
        content: `Your loan application has been received and is under review. We will get back to you shortly.`,
        isRead: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Initial conversation message created for loan:', loanApplication._id);
    } catch (messageError) {
      console.error('Error creating initial message:', messageError);
      // Don't fail the loan application if message creation fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Loan application submitted successfully',
      applicationId: loanApplication._id.toString(),
      institutionName: loanApplication.institutionName
    });
  } catch (error) {
    console.error('Error submitting loan application:', error);
    
    // More detailed error message
    let errorMessage = 'Failed to submit loan application';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
