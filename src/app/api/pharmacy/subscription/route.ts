import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { checkPharmacyAccess, PHARMACY_PERMISSIONS } from '@/lib/pharmacy-rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (!checkPharmacyAccess(userRole, userServiceType, PHARMACY_PERMISSIONS.ORDER_MANAGEMENT)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    // Find current subscription for this pharmacy vendor
    const subscription = await Subscription.findOne({ 
      userId: session.user.id,
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

    // Transform subscription data for pharmacy context
    const pharmacySubscription = {
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
      maxProducts: plan?.maxLoans || 100, // Using maxLoans field for max medicines
      maxStorage: plan?.maxStorage || 1,
      maxStaffAccounts: plan?.maxStaffAccounts || 2,
      paymentMethod: subscription.paymentMethod,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    return NextResponse.json({ 
      success: true, 
      subscription: pharmacySubscription 
    });
  } catch (error) {
    console.error('Error fetching pharmacy subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
