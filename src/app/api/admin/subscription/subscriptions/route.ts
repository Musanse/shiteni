import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscriptions = await Subscription.find({})
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name price')
      .lean();

    // Transform data for frontend
    const transformedSubscriptions = subscriptions.map(subscription => ({
      _id: subscription._id,
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      amount: subscription.amount,
      billingCycle: subscription.billingCycle,
      user: {
        firstName: (subscription.userId as any)?.firstName || '',
        lastName: (subscription.userId as any)?.lastName || '',
        email: (subscription.userId as any)?.email || ''
      },
      plan: {
        name: (subscription.planId as any)?.name || '',
        price: (subscription.planId as any)?.price || 0
      }
    }));

    return NextResponse.json({ 
      success: true, 
      subscriptions: transformedSubscriptions 
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
