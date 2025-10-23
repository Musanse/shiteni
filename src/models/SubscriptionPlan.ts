import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  _id: string;
  name: string;
  description: string;
  vendorType: 'hotel' | 'store' | 'pharmacy' | 'bus';
  planType: 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxLoans: number;
  maxStorage: number; // in GB
  maxStaffAccounts: number; // Maximum staff accounts allowed
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  vendorType: { type: String, enum: ['hotel', 'store', 'pharmacy', 'bus'], required: true },
  planType: { type: String, enum: ['basic', 'premium', 'enterprise'], required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  features: [{ type: String }],
  maxUsers: { type: Number, required: true },
  maxLoans: { type: Number, required: true },
  maxStorage: { type: Number, required: true },
  maxStaffAccounts: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
