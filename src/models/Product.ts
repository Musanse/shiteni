import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  businessName: string;
  name: string;
  description: string;
  type: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTermMonths: number;
  maxTermMonths: number;
  status: 'active' | 'inactive' | 'suspended';
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  processingFee: number;
  latePaymentFee: number;
  earlyPaymentPenalty: number;
  isGuarantorRequired: boolean;
  maxLoanToIncomeRatio: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true 
  },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  minTermMonths: { type: Number, required: true },
  maxTermMonths: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  eligibilityCriteria: [{ type: String }],
  requiredDocuments: [{ type: String }],
  processingFee: { type: Number, default: 0 },
  latePaymentFee: { type: Number, default: 0 },
  earlyPaymentPenalty: { type: Number, default: 0 },
  isGuarantorRequired: { type: Boolean, default: false },
  maxLoanToIncomeRatio: { type: Number, default: 3 }, // 3x monthly income
}, {
  timestamps: true,
});

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
