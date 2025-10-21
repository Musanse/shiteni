import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
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

    // Fetch all active subscription plans for hotel vendors
    const plans = await SubscriptionPlan.find({ 
      isActive: true,
      vendorType: 'hotel'
    })
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    // Transform plans to include hotel-specific features
    const hotelPlans = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      planType: plan.planType,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      maxUsers: plan.maxUsers,
      maxRooms: plan.maxLoans, // Using maxLoans field for max rooms in hotel context
      maxStorage: plan.maxStorage,
      maxStaffAccounts: plan.maxStaffAccounts,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    return NextResponse.json({ 
      success: true, 
      plans: hotelPlans 
    });
  } catch (error) {
    console.error('Error fetching hotel subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
