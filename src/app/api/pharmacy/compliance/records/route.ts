import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

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
    const { default: ComplianceRecord } = await import('@/models/ComplianceRecord');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      pharmacyId: session.user.id
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { responsiblePerson: { $regex: search, $options: 'i' } },
        { recordId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const records = await (ComplianceRecord as any).find(query)
      .sort({ dueDate: 1, priority: -1 })
      .skip(skip)
      .limit(limit);

    const total = await (ComplianceRecord as any).countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance records' }, { status: 500 });
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

    // Dynamic import to avoid build issues
    const { default: ComplianceRecord } = await import('@/models/ComplianceRecord');

    const body = await request.json();
    const {
      type,
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      responsiblePerson,
      notes
    } = body;

    // Check if user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ 
        error: 'Invalid user session' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!type || !title || !description || !dueDate || !priority || !responsiblePerson) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, title, description, dueDate, priority, responsiblePerson' 
      }, { status: 400 });
    }

    // Generate record ID
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const recordId = `CR${year}${month}${day}${timestamp}`;

    const record = await (ComplianceRecord as any).create({
      recordId,
      type,
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      assignedTo: assignedTo || '',
      responsiblePerson,
      documents: [],
      notes: notes || '',
      pharmacyId: new mongoose.Types.ObjectId(session.user.id)
    });

    return NextResponse.json({ 
      success: true, 
      record,
      message: 'Compliance record created successfully'
    });
  } catch (error) {
    console.error('Error creating compliance record:', error);
    return NextResponse.json({ 
      error: 'Failed to create compliance record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
