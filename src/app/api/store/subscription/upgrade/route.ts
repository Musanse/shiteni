import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { lipilaPaymentService, PaymentType, CustomerInfo } from '@/lib/lipila-payment';

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
      // Store payment reference in user record
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'subscription.pendingPlanId': planId,
          'subscription.pendingPaymentId': paymentResponse.transactionId,
          'subscription.pendingAmount': amount
        }
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
