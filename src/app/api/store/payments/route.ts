import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder } from '@/models/Store';

// Payments are derived from orders: one payment per order where total > 0
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending|paid|refunded
    const method = searchParams.get('method'); // cash|online|mobile_money|credit_card
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const match: Record<string, any> = { total: { $gt: 0 } };
    if (status) match.paymentStatus = status;
    if (method) match.paymentMethod = method;
    if (search) {
      match.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Project payments-like response from orders
    const pipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          orderId: '$_id',
          orderNumber: 1,
          customerName: '$shippingAddress.name',
          customerPhone: '$shippingAddress.phone',
          amount: '$total',
          method: '$paymentMethod',
          status: '$paymentStatus',
          createdAt: 1,
        }
      }
    ];

    const results = await StoreOrder.aggregate(pipeline);
    const count = await StoreOrder.countDocuments(match);

    return NextResponse.json({
      success: true,
      payments: results,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching store payments:', error);
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, payments: [], total: 0, totalPages: 0, currentPage: 1 });
    }
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}


