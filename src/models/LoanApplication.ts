import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanApplication extends Document {
  _id: string;
  customerId: string;
  institutionId: string;
  loanProductId: string;
  amount: number;
  purpose: string;
  employmentInfo: {
    employer: string;
    position: string;
    monthlyIncome: number;
    employmentDuration: number;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  rejectionReason?: string;
  documents: {
    idDocument: string;
    proofOfIncome: string;
    bankStatement: string;
    employmentLetter: string;
  };
  riskScore?: number;
  reviewerId?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanApplicationSchema = new Schema<ILoanApplication>({
  customerId: { type: String, required: true },
  institutionId: { type: String, required: true },
  loanProductId: { type: String, required: true },
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  employmentInfo: {
    employer: { type: String, required: true },
    position: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    employmentDuration: { type: Number, required: true },
  },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed'], 
    default: 'pending' 
  },
  rejectionReason: String,
  documents: {
    idDocument: String,
    proofOfIncome: String,
    bankStatement: String,
    employmentLetter: String,
  },
  riskScore: Number,
  reviewerId: String,
  reviewedAt: Date,
}, {
  timestamps: true,
});

export const LoanApplication = mongoose.models.LoanApplication || mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);
