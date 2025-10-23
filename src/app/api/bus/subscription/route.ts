import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { Subscription } from '@/models/Subscription';

// Bus-specific subscription schema for tracking usage
const BusSubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'], 
    default: 'pending' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'mobile_money', 'bank_transfer'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  transactionId: { type: String },
  usage: {
    routes: { type: Number, default: 0 },
    buses: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    passengers: { type: Number, default: 0 },
    dispatches: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  serviceType: { type: String, default: 'bus' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear model cache
if (mongoose.models.BusSubscription) {
  delete mongoose.models.BusSubscription;
}

const BusSubscription = mongoose.model('BusSubscription', BusSubscriptionSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current bus subscription
    const subscription = await BusSubscription.findOne({
      userId: session.user.id,
      status: { $in: ['active', 'pending'] }
    }).populate('planId').lean();

    // Get subscription history
    const subscriptionHistory = await BusSubscription.find({
      userId: session.user.id
    })
    .populate('planId')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Fetch available subscription plans for bus vendors from admin-configured plans
    const availablePlans = await SubscriptionPlan.find({
      vendorType: 'bus',
      isActive: true
    })
    .sort({ sortOrder: 1, planType: 1 })
    .lean();

    // Transform plans to include bus-specific features and limits
    const transformedPlans = availablePlans.map(plan => ({
      _id: plan._id,
      planType: plan.planType,
      planName: plan.name,
      planDescription: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features.map(feature => ({
        name: feature,
        description: feature,
        included: true
      })),
      limits: {
        routes: plan.maxLoans, // Using maxLoans for routes limit
        buses: plan.maxUsers, // Using maxUsers for buses limit
        bookings: plan.maxStorage * 100, // Convert storage to booking limit
        passengers: plan.maxStorage * 1000, // Convert storage to passenger limit
        dispatches: plan.maxStorage * 50, // Convert storage to dispatch limit
        staff: plan.maxStaffAccounts
      },
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder
    }));

    return NextResponse.json({
      success: true,
      subscription,
      subscriptionHistory,
      availablePlans: transformedPlans
    });

  } catch (error) {
    console.error('Error fetching bus subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      planId,
      billingCycle,
      paymentMethod,
      autoRenew
    } = body;

    // Validate required fields
    if (!planId || !billingCycle || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, billingCycle, paymentMethod' },
        { status: 400 }
      );
    }

    // Fetch the selected plan from database
    const selectedPlan = await SubscriptionPlan.findOne({
      _id: planId,
      vendorType: 'bus',
      isActive: true
    });

    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Selected plan not found or inactive' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid billing cycle' },
          { status: 400 }
        );
    }

    // Generate unique subscription ID
    const subscriptionId = `BUS-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create bus subscription
    const subscription = new BusSubscription({
      subscriptionId,
      userId: session.user.id,
      planId: selectedPlan._id,
      status: 'pending',
      startDate,
      endDate,
      nextBillingDate: endDate,
      autoRenew: autoRenew || true,
      paymentMethod,
      paymentStatus: 'pending',
      usage: {
        routes: 0,
        buses: 0,
        bookings: 0,
        passengers: 0,
        dispatches: 0,
        staff: 0
      }
    });

    await subscription.save();

    // Populate the plan details for response
    await subscription.populate('planId');

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription created successfully. Please complete payment to activate.'
    });

  } catch (error) {
    console.error('Error creating bus subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
