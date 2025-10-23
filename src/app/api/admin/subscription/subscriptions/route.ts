import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

interface SessionUser {
  id: string;
  role: string;
}

interface PopulatedUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  businessName?: string;
  serviceType?: string;
}

// Service-specific subscription schemas
const HotelSubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'cash', 'mobile_money'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String },
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
  serviceType: { type: String, default: 'hotel' },
  usage: {
    rooms: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BusSubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'cash', 'mobile_money'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String },
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
  serviceType: { type: String, default: 'bus' },
  usage: {
    routes: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PharmacySubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'cash', 'mobile_money'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String },
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
  serviceType: { type: String, default: 'pharmacy' },
  usage: {
    medicines: { type: Number, default: 0 },
    prescriptions: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const StoreSubscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'cash', 'mobile_money'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String },
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
  serviceType: { type: String, default: 'store' },
  usage: {
    products: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear model cache and create models
if (mongoose.models.HotelSubscription) delete mongoose.models.HotelSubscription;
if (mongoose.models.BusSubscription) delete mongoose.models.BusSubscription;
if (mongoose.models.PharmacySubscription) delete mongoose.models.PharmacySubscription;
if (mongoose.models.StoreSubscription) delete mongoose.models.StoreSubscription;

const HotelSubscription = mongoose.model('HotelSubscription', HotelSubscriptionSchema);
const BusSubscription = mongoose.model('BusSubscription', BusSubscriptionSchema);
const PharmacySubscription = mongoose.model('PharmacySubscription', PharmacySubscriptionSchema);
const StoreSubscription = mongoose.model('StoreSubscription', StoreSubscriptionSchema);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as SessionUser).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch subscriptions from all service types
    const [hotelSubscriptions, busSubscriptions, pharmacySubscriptions, storeSubscriptions] = await Promise.all([
      HotelSubscription.find({}).populate('userId', 'firstName lastName email businessName serviceType').populate('planId', 'name planType price').lean(),
      BusSubscription.find({}).populate('userId', 'firstName lastName email businessName serviceType').populate('planId', 'name planType price').lean(),
      PharmacySubscription.find({}).populate('userId', 'firstName lastName email businessName serviceType').populate('planId', 'name planType price').lean(),
      StoreSubscription.find({}).populate('userId', 'firstName lastName email businessName serviceType').populate('planId', 'name planType price').lean()
    ]);

    // Combine all subscriptions
    const allSubscriptions = [
      ...hotelSubscriptions.map(sub => ({ ...sub, serviceType: 'hotel' })),
      ...busSubscriptions.map(sub => ({ ...sub, serviceType: 'bus' })),
      ...pharmacySubscriptions.map(sub => ({ ...sub, serviceType: 'pharmacy' })),
      ...storeSubscriptions.map(sub => ({ ...sub, serviceType: 'store' }))
    ];

    // Transform data for frontend
    const transformedSubscriptions = allSubscriptions.map(subscription => ({
      _id: subscription._id,
      subscriptionId: subscription.subscriptionId,
      userId: subscription.userId,
      planId: subscription.planId,
      planType: subscription.planId?.planType || 'unknown',
      planName: subscription.planId?.name || 'Unknown Plan',
      planPrice: subscription.planId?.price || 0,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      paymentMethod: subscription.paymentMethod,
      paymentStatus: subscription.paymentStatus,
      autoRenew: subscription.autoRenew,
      serviceType: subscription.serviceType,
      usage: subscription.usage,
      transactionId: subscription.transactionId,
      lipilaTransactionId: subscription.lipilaTransactionId,
      lipilaExternalId: subscription.lipilaExternalId,
      user: {
        firstName: (subscription.userId as PopulatedUser)?.firstName || '',
        lastName: (subscription.userId as PopulatedUser)?.lastName || '',
        email: (subscription.userId as PopulatedUser)?.email || '',
        businessName: (subscription.userId as PopulatedUser)?.businessName || '',
        serviceType: (subscription.userId as PopulatedUser)?.serviceType || subscription.serviceType
      },
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    }));

    // Sort by creation date (newest first)
    transformedSubscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ 
      success: true, 
      subscriptions: transformedSubscriptions 
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
