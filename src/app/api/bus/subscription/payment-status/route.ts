import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { lipilaPaymentService } from '@/lib/lipila-payment';
import { User } from '@/models/User';

// Bus-specific subscription schema
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is bus vendor/staff
    await connectDB();
    
    const currentUser = await (User as any).findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (currentUser.serviceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Find the subscription by transaction ID
    const subscription = await BusSubscription.findOne({
      $or: [
        { transactionId: transactionId },
        { lipilaTransactionId: transactionId }
      ],
      userId: session.user.id
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Get payment status from Lipila
    try {
      const paymentStatusResponse = await lipilaPaymentService.getTransactionStatus(transactionId);
      
      console.log('🔍 Payment Status Response:', paymentStatusResponse);
      
      // Update subscription status based on payment status
      let subscriptionStatus = subscription.status;
      let paymentStatus = subscription.paymentStatus;

      if (paymentStatusResponse.status === 'Successful') {
        subscriptionStatus = 'active';
        paymentStatus = 'paid';
      } else if (paymentStatusResponse.status === 'Failed' || 
                 paymentStatusResponse.status === 'Cancelled') {
        subscriptionStatus = 'inactive';
        paymentStatus = 'failed';
      } else if (paymentStatusResponse.status === 'Pending') {
        subscriptionStatus = 'pending';
        paymentStatus = 'pending';
      }

      // Update subscription if status changed
      if (subscription.status !== subscriptionStatus || subscription.paymentStatus !== paymentStatus) {
        subscription.status = subscriptionStatus;
        subscription.paymentStatus = paymentStatus;
        subscription.updatedAt = new Date();
        await subscription.save();

        console.log('🔄 Updated bus subscription status:', {
          subscriptionId: subscription.subscriptionId,
          oldStatus: subscription.status,
          newStatus: subscriptionStatus,
          paymentStatus: paymentStatus
        });
      }

      return NextResponse.json({
        success: true,
        subscription: {
          _id: subscription._id,
          subscriptionId: subscription.subscriptionId,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          transactionId: subscription.transactionId,
          lipilaTransactionId: subscription.lipilaTransactionId,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          nextBillingDate: subscription.nextBillingDate
        },
        payment: {
          transactionId: paymentStatusResponse.transactionId,
          status: paymentStatusResponse.status,
          amount: paymentStatusResponse.amount,
          currency: paymentStatusResponse.currency
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting payment status from Lipila:', error);
      
      // Return current subscription status if Lipila call fails
      return NextResponse.json({
        success: true,
        subscription: {
          _id: subscription._id,
          subscriptionId: subscription.subscriptionId,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          transactionId: subscription.transactionId,
          lipilaTransactionId: subscription.lipilaTransactionId,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          nextBillingDate: subscription.nextBillingDate
        },
        payment: {
          transactionId: subscription.transactionId,
          status: subscription.paymentStatus,
          amount: 0,
          currency: 'ZMW'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error checking bus subscription payment status:', error);
    return NextResponse.json({
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
