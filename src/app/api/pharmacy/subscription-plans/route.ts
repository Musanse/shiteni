import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
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

    // Fetch all active subscription plans for pharmacy vendors
    const plans = await SubscriptionPlan.find({ 
      isActive: true,
      vendorType: 'pharmacy'
    })
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    // Transform plans to include pharmacy-specific features
    const pharmacyPlans = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      planType: plan.planType,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxLoans, // Using maxLoans field for max medicines in pharmacy context
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
      plans: pharmacyPlans 
    });
  } catch (error) {
    console.error('Error fetching pharmacy subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
