import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { lipilaPaymentService } from '@/lib/lipila-payment';
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get user details
    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find pending subscription with this transaction ID
    const pendingSubscription = await (StoreSubscription as any).findOne({
      userId: session.user.id,
      transactionId: transactionId,
      status: 'pending'
    });

    if (!pendingSubscription) {
      return NextResponse.json({ error: 'No pending payment found for this transaction' }, { status: 404 });
    }

    // Check payment status with Lipila
    try {
      const paymentStatus = await lipilaPaymentService.getTransactionStatus(transactionId);
      
      console.log('Payment status check:', {
        transactionId,
        status: paymentStatus.status,
        userId: user._id
      });

      // If payment is successful, activate subscription
      if (paymentStatus.status === 'Successful') {
        // Get plan details
        const plan = await (SubscriptionPlan as any).findById(pendingSubscription.planId);
        if (!plan) {
          return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
        }

        // Update pending subscription to active
        await (StoreSubscription as any).findByIdAndUpdate(pendingSubscription._id, {
          status: 'active',
          paymentStatus: 'paid',
          lipilaExternalId: paymentStatus.externalId,
          updatedAt: new Date()
        });

        console.log('Subscription activated successfully:', {
          subscriptionId: pendingSubscription.subscriptionId,
          userId: user._id,
          planId: plan._id,
          transactionId
        });

        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment successful! Subscription activated.',
          subscription: {
            id: pendingSubscription._id,
            planName: plan.name,
            status: 'active',
            startDate: pendingSubscription.startDate.toISOString(),
            endDate: pendingSubscription.endDate.toISOString(),
            amount: plan.price,
            currency: plan.currency
          }
        });
      } else if (paymentStatus.status === 'Failed') {
        // Mark subscription as failed
        await (StoreSubscription as any).findByIdAndUpdate(pendingSubscription._id, {
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date()
        });

        return NextResponse.json({
          success: false,
          status: 'failed',
          message: 'Payment failed. Please try again.',
          details: paymentStatus.message
        });
      } else {
        // Payment still pending
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Payment is still being processed. Please wait...',
          details: paymentStatus.message
        });
      }

    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // If it's a timeout or connection error, return pending status
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('ECONNABORTED') ||
        error.message.includes('ENOTFOUND')
      )) {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Checking payment status... Please wait.',
          error: 'Connection timeout - will retry'
        });
      }

      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Error checking payment status. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
