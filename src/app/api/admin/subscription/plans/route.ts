import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const plans = await (SubscriptionPlan as any).find({})
      .sort({ vendorType: 1, sortOrder: 1, price: 1 })
      .lean();

    // Transform plans to match frontend interface
    const transformedPlans = plans.map(plan => ({
      _id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      vendorType: plan.vendorType,
      planType: plan.planType,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxLoans, // Map maxLoans to maxProducts for frontend
      maxStorage: plan.maxStorage,
      maxStaffAccounts: plan.maxStaffAccounts,
      status: plan.isActive ? 'active' : 'inactive',
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    return NextResponse.json({ 
      success: true, 
      plans: transformedPlans 
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, description, vendorType, planType, price, currency, billingCycle, features, maxUsers, maxProducts, maxStorage, maxStaffAccounts, isPopular, isActive } = body;

    if (!name || !description || !vendorType || !planType || !price || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if plan with same vendorType and planType already exists
    const existingPlan = await (SubscriptionPlan as any).findOne({ 
      vendorType, 
      planType 
    });

    if (existingPlan) {
      return NextResponse.json({ 
        error: `A ${planType} plan for ${vendorType} already exists` 
      }, { status: 400 });
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      vendorType,
      planType,
      price,
      currency: currency || 'ZMW',
      billingCycle,
      features: features || [],
      maxUsers: maxUsers || 1,
      maxLoans: maxProducts || 10, // Using maxLoans field for max products/rooms
      maxStorage: maxStorage || 1,
      maxStaffAccounts: maxStaffAccounts || 2,
      isActive: isActive !== false, // Default to true
      isPopular: isPopular || false,
      sortOrder: 0
    });

    await plan.save();

    return NextResponse.json({ 
      success: true, 
      plan,
      message: 'Subscription plan created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}
