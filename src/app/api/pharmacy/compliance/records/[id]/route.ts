import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const record = await ComplianceRecord.findOne({
      _id: params.id,
      pharmacyId: session.user.id
    });

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      record
    });
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const updateData: any = {};

    // Only update provided fields
    if (body.status !== undefined) updateData.status = body.status;
    if (body.completedDate !== undefined) updateData.completedDate = body.completedDate;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.responsiblePerson !== undefined) updateData.responsiblePerson = body.responsiblePerson;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.documents !== undefined) updateData.documents = body.documents;

    const record = await ComplianceRecord.findOneAndUpdate(
      {
        _id: params.id,
        pharmacyId: session.user.id
      },
      updateData,
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      record,
      message: 'Compliance record updated successfully'
    });
  } catch (error) {
    console.error('Error updating compliance record:', error);
    return NextResponse.json({ 
      error: 'Failed to update compliance record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const record = await ComplianceRecord.findOneAndDelete({
      _id: params.id,
      pharmacyId: session.user.id
    });

    if (!record) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Compliance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    return NextResponse.json({ 
      error: 'Failed to delete compliance record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
