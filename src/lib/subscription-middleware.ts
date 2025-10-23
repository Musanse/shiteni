import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Subscription schemas for different vendor types
const HotelSubscriptionSchema = new mongoose.Schema({
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
    rooms: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    guests: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  serviceType: { type: String, default: 'hotel' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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

const PharmacySubscriptionSchema = new mongoose.Schema({
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
    medicines: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  serviceType: { type: String, default: 'pharmacy' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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
if (mongoose.models.HotelSubscription) delete mongoose.models.HotelSubscription;
if (mongoose.models.BusSubscription) delete mongoose.models.BusSubscription;
if (mongoose.models.PharmacySubscription) delete mongoose.models.PharmacySubscription;
if (mongoose.models.StoreSubscription) delete mongoose.models.StoreSubscription;

const HotelSubscription = mongoose.model('HotelSubscription', HotelSubscriptionSchema);
const BusSubscription = mongoose.model('BusSubscription', BusSubscriptionSchema);
const PharmacySubscription = mongoose.model('PharmacySubscription', PharmacySubscriptionSchema);
const StoreSubscription = mongoose.model('StoreSubscription', StoreSubscriptionSchema);

export async function checkVendorSubscription(userId: string, serviceType: string) {
  try {
    await connectDB();

    console.log(`[Subscription Middleware] Checking subscription for userId: ${userId}, serviceType: ${serviceType}`);

    let SubscriptionModel;
    switch (serviceType) {
      case 'hotel':
        SubscriptionModel = HotelSubscription;
        break;
      case 'bus':
        SubscriptionModel = BusSubscription;
        break;
      case 'pharmacy':
        SubscriptionModel = PharmacySubscription;
        break;
      case 'store':
        SubscriptionModel = StoreSubscription;
        break;
      default:
        return { hasActiveSubscription: false, subscription: null, error: 'Invalid service type' };
    }

    console.log(`[Subscription Middleware] Using model: ${SubscriptionModel.modelName}`);

    // First, let's see what subscriptions exist for this user
    const allSubscriptions = await SubscriptionModel.find({ userId: userId });
    console.log(`[Subscription Middleware] All subscriptions for user:`, allSubscriptions);

    const subscription = await SubscriptionModel.findOne({
      userId: userId,
      status: 'active',
      endDate: { $gt: new Date() } // Not expired
    });

    console.log(`[Subscription Middleware] Active subscription found:`, subscription);
    console.log(`[Subscription Middleware] Current date:`, new Date());

    return {
      hasActiveSubscription: !!subscription,
      subscription: subscription,
      error: null
    };
  } catch (error) {
    console.error('Error checking vendor subscription:', error);
    return { hasActiveSubscription: false, subscription: null, error: 'Database error' };
  }
}

export async function withSubscriptionCheck(handler: Function, serviceType: string) {
  return async (request: NextRequest, context: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is a vendor
      const { User } = await import('@/models/User');
      const user = await User.findById(session.user.id);
      
      if (!user || user.serviceType !== serviceType) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // Check subscription status
      const subscriptionCheck = await checkVendorSubscription(session.user.id, serviceType);
      
      if (!subscriptionCheck.hasActiveSubscription) {
        return NextResponse.json({ 
          error: 'Subscription required',
          message: 'You need an active subscription to access this feature',
          subscriptionRequired: true
        }, { status: 402 }); // Payment Required
      }

      // Add subscription info to request context
      request.subscription = subscriptionCheck.subscription;
      
      return handler(request, context);
    } catch (error) {
      console.error('Subscription check error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
