import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PharmacyOrder from '@/models/PharmacyOrder';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { orderId } = params;
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    const order = await PharmacyOrder.findOne({ 
      _id: orderId, 
      pharmacyId: session.user.id 
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status and set appropriate dates
    const updateData: any = { updatedAt: new Date() };
    
    if (status) {
      updateData.status = status;
      
      // Set date based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmedDate = new Date();
          break;
        case 'ready':
          updateData.readyDate = new Date();
          break;
        case 'completed':
          updateData.completedDate = new Date();
          break;
      }
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedOrder = await PharmacyOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating pharmacy order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { orderId } = params;

    const order = await PharmacyOrder.findOne({ 
      _id: orderId, 
      pharmacyId: session.user.id 
    }).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching pharmacy order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
