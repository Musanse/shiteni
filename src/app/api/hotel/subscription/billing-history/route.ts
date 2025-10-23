import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { BillingHistory } from '@/models/BillingHistory';
import { Subscription } from '@/models/Subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a hotel vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied. Hotel vendors only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Fetch billing history for this hotel vendor
    const billingHistory = await BillingHistory.find({ 
      userId: session.user.id,
      serviceType: 'hotel'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await BillingHistory.countDocuments({ 
      userId: session.user.id,
      serviceType: 'hotel'
    });

    // Transform billing history data
    const transformedHistory = billingHistory.map(transaction => ({
      id: transaction._id.toString(),
      date: transaction.createdAt,
      description: transaction.description || 'Subscription Payment',
      amount: transaction.amount,
      currency: transaction.currency || 'ZMW',
      status: transaction.status || 'paid',
      invoice: transaction.reference || `INV-${transaction._id.toString().slice(-6).toUpperCase()}`,
      paymentMethod: transaction.paymentMethod || 'card',
      transactionId: transaction.transactionId || transaction._id.toString(),
      type: transaction.type || 'subscription'
    }));

    return NextResponse.json({
      success: true,
      billingHistory: transformedHistory,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching hotel billing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
