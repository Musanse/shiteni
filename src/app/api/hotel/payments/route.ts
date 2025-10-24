import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const search = searchParams.get('search');

    // Build query
    const query: any = { vendorId: user.id };

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await (Payment as any).find(query)
      .sort({ processedAt: -1 })
      .lean();

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only allow hotel vendors to create payments
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      roomNumber,
      roomType,
      amount,
      paymentMethod,
      paymentStatus = 'pending',
      processedBy,
      notes,
      currency = 'USD',
      fees = 0
    } = body;

    // Validate required fields
    if (!bookingId || !customerName || !customerEmail || !customerPhone || 
        !roomNumber || !roomType || !amount || !paymentMethod || !processedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate net amount
    const netAmount = amount - fees;

    const payment = new Payment({
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      roomNumber,
      roomType,
      amount,
      paymentMethod,
      paymentStatus,
      processedBy,
      vendorId: user.id,
      notes,
      currency,
      fees,
      netAmount
    });

    await (payment as any).save();

    return NextResponse.json({ 
      message: 'Payment created successfully',
      payment: payment.toObject()
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
