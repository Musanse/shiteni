import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only allow hotel vendors to access payments
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const payment = await Payment.findOne({
      _id: id,
      vendorId: user.id
    }).lean();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only allow hotel vendors to update payments
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      paymentStatus,
      refundAmount,
      refundReason,
      notes
    } = body;

    const updateData: any = {};
    
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (refundAmount !== undefined) updateData.refundAmount = refundAmount;
    if (refundReason) updateData.refundReason = refundReason;
    if (notes) updateData.notes = notes;

    const payment = await Payment.findOneAndUpdate(
      { _id: id, vendorId: user.id },
      updateData,
      { new: true }
    ).lean();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only allow hotel vendors to delete payments
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const payment = await Payment.findOneAndDelete({
      _id: id,
      vendorId: user.id
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
