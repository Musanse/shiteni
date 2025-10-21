import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';

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

    // Find current subscription for this hotel vendor
    const subscription = await Subscription.findOne({ 
      vendorId: session.user.id,
      status: { $in: ['active', 'pending'] }
    }).lean();

    if (!subscription) {
      return NextResponse.json({ 
        success: true, 
        subscription: null,
        message: 'No active subscription found' 
      });
    }

    // Get the subscription plan details
    const plan = await SubscriptionPlan.findById(subscription.planId).lean();

    // Transform subscription data for hotel context
    const hotelSubscription = {
      id: subscription._id.toString(),
      planId: subscription.planId,
      planName: plan?.name || 'Unknown Plan',
      planType: plan?.planType || 'basic',
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextPaymentDate,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      features: plan?.features || [],
      maxUsers: plan?.maxUsers || 1,
      maxRooms: plan?.maxLoans || 10, // Using maxLoans field for max rooms
      maxStorage: plan?.maxStorage || 1,
      maxStaffAccounts: plan?.maxStaffAccounts || 2,
      paymentMethod: subscription.paymentMethod,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    return NextResponse.json({ 
      success: true, 
      subscription: hotelSubscription 
    });
  } catch (error) {
    console.error('Error fetching hotel subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
