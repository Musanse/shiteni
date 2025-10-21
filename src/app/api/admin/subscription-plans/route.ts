import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const plans = await SubscriptionPlan.find(query)
      .sort({ sortOrder: 1, createdAt: -1 });

    return NextResponse.json({ plans });
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
    console.log('Subscription plan creation request body:', body);
    
    const {
      name,
      description,
      vendorType,
      planType,
      price,
      currency,
      billingCycle,
      features,
      maxProducts,
      maxStaffAccounts,
      isActive,
      isPopular,
      sortOrder
    } = body;

    // Validate required fields
    if (!name || !description || !vendorType || !planType || !price || !billingCycle) {
      console.log('Missing required fields:', { name, description, vendorType, planType, price, billingCycle });
      return NextResponse.json(
        { error: 'Missing required fields', details: { name: !!name, description: !!description, vendorType: !!vendorType, planType: !!planType, price: !!price, billingCycle: !!billingCycle } },
        { status: 400 }
      );
    }

    // Check if plan type already exists for this vendor type
    const existingPlan = await SubscriptionPlan.findOne({ vendorType, planType });
    if (existingPlan) {
      console.log('Plan type already exists for vendor type:', vendorType, planType, 'Existing plan:', existingPlan.name);
      return NextResponse.json(
        { error: `A ${planType} plan already exists for ${vendorType} vendors`, vendorType, planType },
        { status: 400 }
      );
    }

    // Set default staff account limits based on plan type
    let defaultMaxStaffAccounts = maxStaffAccounts;
    if (defaultMaxStaffAccounts === undefined || defaultMaxStaffAccounts === null) {
      switch (planType) {
        case 'basic':
          defaultMaxStaffAccounts = 2;
          break;
        case 'premium':
          defaultMaxStaffAccounts = 5;
          break;
        case 'enterprise':
          defaultMaxStaffAccounts = -1; // -1 means unlimited
          break;
        default:
          defaultMaxStaffAccounts = 2;
      }
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
      maxUsers: planType === 'basic' ? 10 : planType === 'premium' ? 100 : 1000,
      maxLoans: maxProducts || (planType === 'basic' ? 100 : planType === 'premium' ? 1000 : 10000),
      maxStorage: planType === 'basic' ? 10 : planType === 'premium' ? 100 : 1000,
      maxStaffAccounts: defaultMaxStaffAccounts,
      isActive: isActive !== false,
      isPopular: isPopular || false,
      sortOrder: sortOrder || 0
    });

    await plan.save();

    return NextResponse.json({ 
      message: 'Subscription plan created successfully',
      plan 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { planId, ...updateData } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      planId,
      updateData,
      { new: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Subscription plan updated successfully',
      plan 
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(planId);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Subscription plan deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
}
