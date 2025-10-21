import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  businessName?: string;
  planType: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  features?: string[];
  maxUsers?: number;
  maxLoans?: number;
  maxStorage?: number; // in GB
  paymentMethod: 'card' | 'bank_transfer' | 'cash' | 'mobile_money';
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  autoRenew: boolean;
  notes?: string;
  // Lipila payment details
  lipilaTransactionId?: string;
  lipilaExternalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String },
  planType: { type: String, enum: ['basic', 'premium', 'enterprise'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextBillingDate: { type: Date },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  features: [{ type: String }],
  maxUsers: { type: Number },
  maxLoans: { type: Number },
  maxStorage: { type: Number },
  paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'cash', 'mobile_money'], required: true },
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  notes: { type: String },
  // Lipila payment details
  lipilaTransactionId: { type: String },
  lipilaExternalId: { type: String },
}, {
  timestamps: true,
});

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
