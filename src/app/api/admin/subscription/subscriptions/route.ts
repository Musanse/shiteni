import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as SubscriptionModule from '@/models/Subscription';
const { Subscription } = SubscriptionModule;

interface SessionUser {
  id: string;
  role: string;
}

interface PopulatedUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  businessName?: string;
  serviceType?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as SessionUser).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscriptions = await Subscription.find({})
      .populate('userId', 'firstName lastName email businessName serviceType')
      .lean();

    // Transform data for frontend
    const transformedSubscriptions = subscriptions.map(subscription => ({
      _id: subscription._id,
      userId: subscription.userId,
      planType: subscription.planType,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      paymentMethod: subscription.paymentMethod,
      autoRenew: subscription.autoRenew,
      businessName: subscription.businessName,
      user: {
        firstName: (subscription.userId as PopulatedUser)?.firstName || '',
        lastName: (subscription.userId as PopulatedUser)?.lastName || '',
        email: (subscription.userId as PopulatedUser)?.email || '',
        businessName: (subscription.userId as PopulatedUser)?.businessName || '',
        serviceType: (subscription.userId as PopulatedUser)?.serviceType || ''
      },
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
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
