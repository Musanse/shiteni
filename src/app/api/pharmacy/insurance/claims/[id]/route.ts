import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const claim = await InsuranceClaim.findOne({ 
      _id: id, 
      pharmacyId: session.user.id 
    });

    if (!claim) {
      return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error('Error fetching insurance claim:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance claim' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { status, approvedAmount, notes } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      if (status === 'approved' || status === 'rejected') {
        updateData.processedDate = new Date();
      }
    }

    if (approvedAmount !== undefined) {
      updateData.approvedAmount = parseFloat(approvedAmount);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const claim = await InsuranceClaim.findOneAndUpdate(
      { _id: id, pharmacyId: session.user.id },
      updateData,
      { new: true }
    );

    if (!claim) {
      return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      claim,
      message: 'Insurance claim updated successfully'
    });
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    return NextResponse.json({ error: 'Failed to update insurance claim' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const claim = await InsuranceClaim.findOneAndDelete({ 
      _id: id, 
      pharmacyId: session.user.id 
    });

    if (!claim) {
      return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Insurance claim deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    return NextResponse.json({ error: 'Failed to delete insurance claim' }, { status: 500 });
  }
}
