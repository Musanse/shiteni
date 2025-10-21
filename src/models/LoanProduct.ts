import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanProduct extends Document {
  _id: string;
  institutionId: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  termMonths: number;
  requirements: {
    minCreditScore?: number;
    minIncome?: number;
    employmentDuration?: number;
    documents: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LoanProductSchema = new Schema<ILoanProduct>({
  institutionId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  termMonths: { type: Number, required: true },
  requirements: {
    minCreditScore: Number,
    minIncome: Number,
    employmentDuration: Number,
    documents: [{ type: String }],
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const LoanProduct = mongoose.models.LoanProduct || mongoose.model<ILoanProduct>('LoanProduct', LoanProductSchema);
