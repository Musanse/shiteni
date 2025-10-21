import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
// Dynamic import to avoid build issues
import { formatCurrency } from '@/lib/currency';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    // Dynamic import to avoid build issues
    const { default: InsuranceClaim } = await import('@/models/InsuranceClaim');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      pharmacyId: session.user.id
    };

    if (search) {
      query.$or = [
        { claimNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { insuranceProvider: { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const claims = await InsuranceClaim.find(query)
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InsuranceClaim.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      claims,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance claims' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();
    console.log('🔍 Database connected successfully');

    // Dynamic import to avoid build issues
    const { default: InsuranceClaim } = await import('@/models/InsuranceClaim');
    console.log('🔍 InsuranceClaim model loaded:', !!InsuranceClaim);

    const body = await request.json();
    console.log('🔍 Request body:', body);
    console.log('🔍 Session user:', session.user);
    console.log('🔍 Session user ID:', session.user.id);
    console.log('🔍 Session user ID type:', typeof session.user.id);
    
    const {
      patientId,
      patientName,
      insuranceProvider,
      policyNumber,
      claimAmount,
      notes
    } = body;

    // Check if user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ 
        error: 'Invalid user session' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!patientId || !patientName || !insuranceProvider || !policyNumber || !claimAmount) {
      return NextResponse.json({ 
        error: 'Missing required fields: patientId, patientName, insuranceProvider, policyNumber, claimAmount' 
      }, { status: 400 });
    }

    // Validate claim amount
    const parsedAmount = parseFloat(claimAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid claim amount. Must be a positive number.' 
      }, { status: 400 });
    }

    console.log('🔍 About to create claim with data:', {
      patientId,
      patientName,
      insuranceProvider,
      policyNumber,
      claimAmount: parsedAmount,
      notes: notes || '',
      attachments: [],
      pharmacyId: new mongoose.Types.ObjectId(session.user.id),
      submissionDate: new Date()
    });

    // Generate claim number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const claimNumber = `IC${year}${month}${day}${timestamp}`;

    const claim = await InsuranceClaim.create({
      claimNumber,
      patientId,
      patientName,
      insuranceProvider,
      policyNumber,
      claimAmount: parsedAmount,
      notes: notes || '',
      attachments: [],
      pharmacyId: new mongoose.Types.ObjectId(session.user.id),
      submissionDate: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      claim,
      message: 'Insurance claim submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating insurance claim:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
    }
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      console.error('❌ Duplicate key error:', error.keyValue);
    }
    
    return NextResponse.json({ 
      error: 'Failed to create insurance claim',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
