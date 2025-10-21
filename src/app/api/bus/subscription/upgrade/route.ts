import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { lipilaPaymentService, PaymentType, CustomerInfo } from '@/lib/lipila-payment';
import { User } from '@/models/User';

// Lipila configuration
const LIPILA_CONFIG = {
  currency: process.env.LIPILA_CURRENCY || 'ZMW'
};

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
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is bus vendor/staff
    await connectDB();
    
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (currentUser.serviceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    const { planId, paymentType = 'mobile_money', customerInfo } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Validate payment type
    if (!['mobile_money', 'mobile-money', 'card'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type. Must be mobile_money, mobile-money, or card' }, { status: 400 });
    }

    // Normalize payment type for Lipila service
    const normalizedPaymentType = paymentType === 'mobile_money' ? 'mobile-money' : paymentType;

    // Validate customer info for payment
    if (!customerInfo || !customerInfo.phoneNumber) {
      return NextResponse.json({ error: 'Customer phone number is required for payment' }, { status: 400 });
    }

    // Verify the plan exists and is active
    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      vendorType: 'bus',
      isActive: true
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    // Check for existing active subscription
    const existingSubscription = await BusSubscription.findOne({
      userId: session.user.id,
      status: { $in: ['active', 'pending'] }
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (plan.billingCycle) {
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
        return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    console.log('🚌 Processing bus subscription payment:', {
      plan: plan.name,
      amount: plan.price,
      paymentType: normalizedPaymentType,
      userId: session.user.id
    });

    // Process payment through Lipila
    let paymentResponse;
    
    if (normalizedPaymentType === 'card') {
      paymentResponse = await lipilaPaymentService.processCardPayment({
        currency: LIPILA_CONFIG.currency,
        amount: plan.price,
        phoneNumber: customerInfo.phoneNumber,
        email: customerInfo.email,
        fullName: customerInfo.name,
        externalId: `BUS-SUB-${Date.now()}`,
        narration: `Bus Subscription - ${plan.name}`,
        clientRedirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/vendor/bus/subscription?payment=success&transactionId=BUS-SUB-${Date.now()}`,
        customer: customerInfo
      });
    } else {
      paymentResponse = await lipilaPaymentService.processMobileMoneyPayment({
        currency: LIPILA_CONFIG.currency,
        amount: plan.price,
        phoneNumber: customerInfo.phoneNumber,
        email: customerInfo.email,
        fullName: customerInfo.name,
        externalId: `BUS-SUB-${Date.now()}`,
        narration: `Bus Subscription - ${plan.name}`,
        customer: customerInfo
      });
    }

    console.log('🔍 Payment Response Debug:', {
      response: paymentResponse,
      status: paymentResponse?.status,
      transactionId: paymentResponse?.transactionId,
      externalId: paymentResponse?.externalId,
      message: paymentResponse?.message,
      hasTransactionId: !!paymentResponse?.transactionId,
      hasExternalId: !!paymentResponse?.externalId,
      responseKeys: paymentResponse ? Object.keys(paymentResponse) : 'No response'
    });

    // Check if payment was initiated successfully (more flexible validation)
    if (!paymentResponse) {
      console.error('❌ No payment response received');
      return NextResponse.json({
        error: 'Payment processing failed',
        details: 'No response from payment service'
      }, { status: 400 });
    }

    // Check for transaction ID in different possible fields
    const transactionId = paymentResponse.transactionId || 
                        paymentResponse.externalId || 
                        paymentResponse.id ||
                        paymentResponse.transaction_id;

    if (!transactionId) {
      console.error('❌ No transaction ID found in response:', paymentResponse);
      return NextResponse.json({
        error: 'Payment processing failed',
        details: 'No transaction ID received from payment service'
      }, { status: 400 });
    }

    // For mobile money, payment might be pending initially
    const isPaymentSuccessful = paymentResponse.status === 'Successful' || 
                               paymentResponse.status === 'Pending' ||
                               paymentResponse.status === 'success' ||
                               paymentResponse.status === 'pending';

    console.log('💳 Payment Status Check:', {
      status: paymentResponse.status,
      isPaymentSuccessful,
      transactionId,
      willCreateSubscription: true
    });

    // Generate unique subscription ID
    const subscriptionId = `BUS-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('📝 Creating subscription with:', {
      subscriptionId,
      userId: session.user.id,
      planId: plan._id,
      status: isPaymentSuccessful ? 'active' : 'pending',
      paymentStatus: isPaymentSuccessful ? 'paid' : 'pending',
      transactionId
    });

    // Create or update subscription
    let subscription;
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.planId = plan._id;
      existingSubscription.status = isPaymentSuccessful ? 'active' : 'pending';
      existingSubscription.startDate = startDate;
      existingSubscription.endDate = endDate;
      existingSubscription.nextBillingDate = endDate;
      existingSubscription.paymentMethod = normalizedPaymentType;
      existingSubscription.paymentStatus = isPaymentSuccessful ? 'paid' : 'pending';
      existingSubscription.transactionId = transactionId;
      existingSubscription.lipilaTransactionId = transactionId;
      existingSubscription.lipilaExternalId = paymentResponse.externalId || transactionId;
      existingSubscription.updatedAt = new Date();
      
      await existingSubscription.save();
      subscription = existingSubscription;
      
      console.log('✅ Updated existing bus subscription:', {
        subscriptionId: existingSubscription.subscriptionId,
        plan: plan.name,
        status: 'active'
      });
    } else {
      // Create new subscription
      subscription = new BusSubscription({
        subscriptionId,
        userId: session.user.id,
        planId: plan._id,
        status: isPaymentSuccessful ? 'active' : 'pending',
        startDate,
        endDate,
        nextBillingDate: endDate,
        autoRenew: true,
        paymentMethod: normalizedPaymentType,
        paymentStatus: isPaymentSuccessful ? 'paid' : 'pending',
        transactionId: transactionId,
        lipilaTransactionId: transactionId,
        lipilaExternalId: paymentResponse.externalId || transactionId,
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
      
      console.log('✅ Created new bus subscription:', {
        subscriptionId,
        plan: plan.name,
        status: 'active'
      });
    }

    // Populate the plan details for response
    await subscription.populate('planId');

    return NextResponse.json({
      success: true,
      subscription: {
        _id: subscription._id,
        subscriptionId: subscription.subscriptionId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        autoRenew: subscription.autoRenew,
        paymentMethod: subscription.paymentMethod,
        paymentStatus: subscription.paymentStatus,
        transactionId: subscription.transactionId,
        lipilaTransactionId: subscription.lipilaTransactionId,
        lipilaExternalId: subscription.lipilaExternalId,
        usage: subscription.usage,
        serviceType: subscription.serviceType,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      },
      payment: {
        transactionId: transactionId,
        externalId: paymentResponse.externalId || transactionId,
        status: paymentResponse.status,
        amount: paymentResponse.amount,
        currency: paymentResponse.currency
      },
      message: isPaymentSuccessful 
        ? 'Bus subscription upgraded successfully!' 
        : 'Payment initiated! Please complete payment on your phone.'
    });

  } catch (error) {
    console.error('❌ Error upgrading bus subscription:', error);
    
    if (error instanceof Error && error.message.includes('LIPILA')) {
      console.error('📖 See LIPILA_SETUP_GUIDE.md for setup instructions');
      return NextResponse.json({
        error: 'Payment service configuration error',
        details: 'Please contact support for payment processing issues'
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to upgrade subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
