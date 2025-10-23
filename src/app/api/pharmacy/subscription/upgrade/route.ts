import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { checkPharmacyAccess, PHARMACY_PERMISSIONS } from '@/lib/pharmacy-rbac';
import { lipilaPaymentService, PaymentType, CustomerInfo } from '@/lib/lipila-payment';

export async function POST(request: NextRequest) {
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
      vendorType: 'pharmacy',
      isActive: true
    });

    if (!plan) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId: session.user.id,
      status: { $in: ['active', 'pending'] }
    });

    // Process payment through Lipila
    console.log('Processing subscription payment through Lipila...');
    
    try {
      const paymentResponse = await lipilaPaymentService.processSubscriptionPayment(
        existingSubscription?._id?.toString() || `new-${Date.now()}`,
        plan.price,
        normalizedPaymentType as PaymentType,
        customerInfo as CustomerInfo,
        `Pharmacy subscription upgrade to ${plan.name}`
      );

      console.log('Lipila payment response:', paymentResponse);

      // For mobile money, 'Pending' status means payment was initiated successfully
      const isPaymentSuccessful = paymentResponse.status === 'Successful' || 
                                 (normalizedPaymentType === 'mobile-money' && paymentResponse.status === 'Pending');

      if (!isPaymentSuccessful) {
        return NextResponse.json({
          error: 'Payment failed',
          message: paymentResponse.message,
          paymentResponse
        }, { status: 400 });
      }

      // Payment successful, now create/update subscription
      if (existingSubscription) {
        // Update existing subscription
        existingSubscription.planId = planId;
        existingSubscription.planType = plan.planType; // Add required planType
        existingSubscription.amount = plan.price;
        existingSubscription.currency = plan.currency;
        existingSubscription.billingCycle = plan.billingCycle;
        existingSubscription.status = 'active'; // Set to active since payment succeeded
        existingSubscription.paymentMethod = normalizedPaymentType === 'mobile-money' ? 'mobile_money' : 'card'; // Use valid enum value
        existingSubscription.lipilaTransactionId = paymentResponse.transactionId;
        existingSubscription.lipilaExternalId = paymentResponse.externalId;
        existingSubscription.lastPaymentDate = new Date();
        existingSubscription.updatedAt = new Date();
        
        await existingSubscription.save();

        return NextResponse.json({
          success: true,
          message: 'Subscription upgraded successfully',
          subscription: {
            id: existingSubscription._id.toString(),
            planId: existingSubscription.planId,
            planName: plan.name,
            planType: existingSubscription.planType,
            status: existingSubscription.status,
            amount: existingSubscription.amount,
            currency: existingSubscription.currency,
            billingCycle: existingSubscription.billingCycle,
            startDate: existingSubscription.startDate,
            endDate: existingSubscription.endDate,
            autoRenew: existingSubscription.autoRenew,
            paymentMethod: existingSubscription.paymentMethod,
            lipilaTransactionId: existingSubscription.lipilaTransactionId,
            createdAt: existingSubscription.createdAt,
            updatedAt: existingSubscription.updatedAt
          },
          paymentResponse
        });
      } else {
        // Create new subscription
        const startDate = new Date();
        const endDate = new Date();
        
        // Calculate end date based on billing cycle
        if (plan.billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.billingCycle === 'quarterly') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (plan.billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const newSubscription = new Subscription({
          userId: session.user.id,
          planId: planId,
          planType: plan.planType, // Add required planType
          amount: plan.price,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          status: 'active', // Set to active since payment succeeded
          startDate: startDate,
          endDate: endDate,
          nextPaymentDate: endDate,
          autoRenew: true,
          paymentMethod: normalizedPaymentType === 'mobile-money' ? 'mobile_money' : 'card', // Use valid enum value
          lipilaTransactionId: paymentResponse.transactionId,
          lipilaExternalId: paymentResponse.externalId,
          lastPaymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newSubscription.save();

        return NextResponse.json({
          success: true,
          message: 'Subscription created successfully',
          subscription: {
            id: newSubscription._id.toString(),
            planId: newSubscription.planId,
            planName: plan.name,
            planType: newSubscription.planType,
            status: newSubscription.status,
            amount: newSubscription.amount,
            currency: newSubscription.currency,
            billingCycle: newSubscription.billingCycle,
            startDate: newSubscription.startDate,
            endDate: newSubscription.endDate,
            autoRenew: newSubscription.autoRenew,
            paymentMethod: newSubscription.paymentMethod,
            lipilaTransactionId: newSubscription.lipilaTransactionId,
            createdAt: newSubscription.createdAt,
            updatedAt: newSubscription.updatedAt
          },
          paymentResponse
        }, { status: 201 });
      }
    } catch (paymentError) {
      console.error('Lipila payment processing error:', paymentError);
      
      // Check if this is an API key issue
      const isApiKeyError = paymentError instanceof Error && 
        (paymentError.message.includes('Unauthorized') || 
         paymentError.message.includes('401') ||
         paymentError.message.includes('API key'));
      
      if (isApiKeyError) {
        console.error('🚨 CRITICAL: Invalid Lipila API key detected');
        console.error('💳 Payment failed due to invalid API credentials');
        console.error('📖 See LIPILA_SETUP_GUIDE.md for setup instructions');
        
        return NextResponse.json({
          error: 'Payment service unavailable',
          message: 'Payment processing is currently unavailable due to configuration issues. Please contact support.',
          details: 'Invalid API credentials detected',
          subscription: null
        }, { status: 503 }); // Service Unavailable
      }
      
      // For other payment errors, create pending subscription
      if (existingSubscription) {
        existingSubscription.planId = planId;
        existingSubscription.planType = plan.planType;
        existingSubscription.amount = plan.price;
        existingSubscription.currency = plan.currency;
        existingSubscription.billingCycle = plan.billingCycle;
        existingSubscription.status = 'pending';
        existingSubscription.paymentMethod = normalizedPaymentType === 'mobile-money' ? 'mobile_money' : 'card';
        existingSubscription.updatedAt = new Date();
        
        await existingSubscription.save();
      } else {
        const startDate = new Date();
        const endDate = new Date();
        
        if (plan.billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.billingCycle === 'quarterly') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (plan.billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const newSubscription = new Subscription({
          userId: session.user.id,
          planId: planId,
          planType: plan.planType,
          amount: plan.price,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          status: 'pending',
          startDate: startDate,
          endDate: endDate,
          nextPaymentDate: endDate,
          autoRenew: true,
          paymentMethod: normalizedPaymentType === 'mobile-money' ? 'mobile_money' : 'card',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newSubscription.save();
      }

      return NextResponse.json({
        error: 'Payment processing failed',
        message: paymentError instanceof Error ? paymentError.message : 'Unknown payment error',
        subscription: existingSubscription ? {
          id: existingSubscription._id.toString(),
          planId: existingSubscription.planId,
          planName: plan.name,
          status: existingSubscription.status
        } : {
          planId: planId,
          planName: plan.name,
          status: 'pending'
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error upgrading pharmacy subscription:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
