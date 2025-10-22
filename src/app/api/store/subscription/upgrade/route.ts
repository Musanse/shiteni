import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { lipilaPaymentService, PaymentType, CustomerInfo } from '@/lib/lipila-payment';
import mongoose from 'mongoose';

// Store subscription schema
const StoreSubscriptionSchema = new mongoose.Schema({
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
    products: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  serviceType: { type: String, default: 'store' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear model cache
if (mongoose.models.StoreSubscription) {
  delete mongoose.models.StoreSubscription;
}

const StoreSubscription = mongoose.model('StoreSubscription', StoreSubscriptionSchema);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { planId, paymentMethod, mobileMoneyContact } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    if (!mobileMoneyContact?.phoneNumber) {
      return NextResponse.json({ error: 'Mobile money phone number is required' }, { status: 400 });
    }

    // Auto-detect network based on phone number
    const detectNetwork = (phoneNumber: string) => {
      if (phoneNumber.startsWith('097') || phoneNumber.startsWith('096')) return 'mtn';
      if (phoneNumber.startsWith('077') || phoneNumber.startsWith('076')) return 'airtel';
      if (phoneNumber.startsWith('095')) return 'zamtel';
      return 'mtn'; // Default fallback
    };

    const detectedNetwork = detectNetwork(mobileMoneyContact.phoneNumber);

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const amount = plan.price;
    const currency = plan.currency || 'ZMW';

    console.log('Initializing Lipila payment with:', {
      amount,
      currency: plan.currency || 'ZMW',
      customer_phone: mobileMoneyContact.phoneNumber,
      detectedNetwork,
      planName: plan.name
    });

    // Prepare customer info for Lipila payment service
    const customerInfo: CustomerInfo = {
      phoneNumber: mobileMoneyContact.phoneNumber,
      email: user.email,
      fullName: user.name || `${user.firstName} ${user.lastName}`,
      customerFirstName: user.firstName || user.name?.split(' ')[0] || 'Customer',
      customerLastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || 'User',
      customerCity: 'Lusaka',
      customerCountry: 'Zambia'
    };

    // Process payment using the working Lipila service
    const paymentResponse = await lipilaPaymentService.processSubscriptionPayment(
      `store-${planId}-${Date.now()}`,
      amount,
      'mobile-money' as PaymentType,
      customerInfo,
      `Store subscription upgrade to ${plan.name} (${detectedNetwork.toUpperCase()})`
    );

    console.log('Lipila payment response:', paymentResponse);
    
    // Check if payment was initiated successfully
    if (paymentResponse.status === 'Successful' || paymentResponse.status === 'Pending') {
      // Calculate subscription dates
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
          endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
      }

      // Create pending subscription record
      const subscriptionId = `store-${user._id}-${Date.now()}`;
      const pendingSubscription = new StoreSubscription({
        subscriptionId,
        userId: user._id,
        planId: plan._id,
        status: 'pending',
        startDate,
        endDate,
        nextBillingDate: endDate,
        autoRenew: true,
        paymentMethod: 'mobile_money',
        paymentStatus: 'pending',
        transactionId: paymentResponse.transactionId,
        lipilaTransactionId: paymentResponse.transactionId,
        lipilaExternalId: paymentResponse.externalId,
        serviceType: 'store'
      });

      await pendingSubscription.save();

      console.log('Pending subscription created:', {
        subscriptionId,
        userId: user._id,
        planId: plan._id,
        transactionId: paymentResponse.transactionId
      });

      return NextResponse.json({
        success: true,
        paymentUrl: paymentResponse.redirectUrl || paymentResponse.clientRedirectUrl,
        paymentId: paymentResponse.transactionId,
        transactionId: paymentResponse.transactionId, // For monitoring
        message: 'Payment initiated successfully. Please check your mobile money for payment prompt.',
        paymentStatus: paymentResponse.status,
        externalId: paymentResponse.externalId,
        monitoringUrl: `/api/store/subscription/payment-status?transactionId=${paymentResponse.transactionId}`
      });
    } else {
      console.error('Lipila payment failed:', paymentResponse);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize payment',
        details: paymentResponse.message || 'Payment initiation failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Store subscription upgrade error:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment processing failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
