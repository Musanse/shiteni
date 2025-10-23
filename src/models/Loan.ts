import mongoose, { Document, Schema } from 'mongoose';

export interface ILoan extends Document {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  dateOfBirth?: string;
  occupation?: string;
  institutionId: string;
  institutionName: string;
  loanType: 'personal' | 'business' | 'mortgage' | 'auto' | 'education' | 'emergency';
  amount: number;
  interestRate: number;
  termMonths: number;
  status: 'pending' | 'pending_review' | 'approved' | 'active' | 'completed' | 'defaulted' | 'cancelled' | 'under_review' | 'rejected' | 'assessment' | 'approvals' | 'disbursement' | 'disbursed' | 'recovery';
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  maturityDate?: Date;
  monthlyPayment: number;
  remainingBalance: number;
  creditScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
  purpose: string;
  monthlyIncome?: number;
  employmentStatus?: string;
  employerName?: string;
  employmentDuration?: string;
  reference1Name?: string;
  reference1Phone?: string;
  reference1Relationship?: string;
  reference2Name?: string;
  reference2Phone?: string;
  reference2Relationship?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorAddress?: string;
  guarantorRelationship?: string;
  guarantorMonthlyIncome?: number;
  collateral?: {
    type: string;
    value: number;
    description: string;
  };
  guarantor?: {
    name: string;
    relationship: string;
    contact: string;
  };
  documents: { [key: string]: string };
  notes?: string;
  // Assessment fields
  assessmentScore?: number;
  assessmentNotes?: string;
  assessmentDate?: Date;
  assessedBy?: string;
  rejectionDate?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  reviewDate?: Date;
  reviewedBy?: string;
  // Disbursement fields
  disbursementMethod?: 'bank_transfer' | 'cash' | 'check' | 'mobile_money';
  bankAccount?: string;
  mobileMoneyNumber?: string;
  disbursedBy?: string;
  // Recovery fields
  recoveryMethod?: 'phone_call' | 'email' | 'sms' | 'field_visit' | 'legal_action';
  recoveryNotes?: string;
  recoveryAgent?: string;
  lastRecoveryAction?: Date;
  lastContactDate?: Date;
  lastContactMethod?: string;
  lastContactAgent?: string;
  contactNotes?: string;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  paymentNotes?: string;
  escalationDate?: Date;
  escalationReason?: string;
  escalatedBy?: string;
  writeOffDate?: Date;
  writeOffReason?: string;
  writtenOffBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>({
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  customerAddress: { type: String },
  customerCity: { type: String },
  customerCountry: { type: String },
  dateOfBirth: { type: String },
  occupation: { type: String },
  institutionId: { type: String, required: true },
  institutionName: { type: String, required: true },
  loanType: { 
    type: String,
    required: true 
  },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  termMonths: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'pending_review', 'approved', 'active', 'completed', 'defaulted', 'cancelled', 'under_review', 'rejected', 'assessment', 'approvals', 'disbursement', 'disbursed', 'recovery'], 
    default: 'pending' 
  },
  applicationDate: { type: Date, required: true },
  approvalDate: { type: Date },
  disbursementDate: { type: Date },
  maturityDate: { type: Date },
  monthlyPayment: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  creditScore: { type: Number },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  purpose: { type: String, required: true },
  monthlyIncome: { type: Number },
  employmentStatus: { type: String },
  employerName: { type: String },
  employmentDuration: { type: String },
  reference1Name: { type: String },
  reference1Phone: { type: String },
  reference1Relationship: { type: String },
  reference2Name: { type: String },
  reference2Phone: { type: String },
  reference2Relationship: { type: String },
  guarantorName: { type: String },
  guarantorPhone: { type: String },
  guarantorEmail: { type: String },
  guarantorAddress: { type: String },
  guarantorRelationship: { type: String },
  guarantorMonthlyIncome: { type: Number },
  collateral: {
    type: { type: String },
    value: { type: Number },
    description: { type: String }
  },
  guarantor: {
    name: { type: String },
    relationship: { type: String },
    contact: { type: String }
  },
  documents: { type: Object, default: {} },
  notes: { type: String },
  // Assessment fields
  assessmentScore: { type: Number },
  assessmentNotes: { type: String },
  assessmentDate: { type: Date },
  assessedBy: { type: String },
  rejectionDate: { type: Date },
  rejectedBy: { type: String },
  rejectionReason: { type: String },
  reviewDate: { type: Date },
  reviewedBy: { type: String },
  // Disbursement fields
  disbursementMethod: { 
    type: String, 
    enum: ['bank_transfer', 'cash', 'check', 'mobile_money'] 
  },
  bankAccount: { type: String },
  mobileMoneyNumber: { type: String },
  disbursedBy: { type: String },
  // Recovery fields
  recoveryMethod: { 
    type: String, 
    enum: ['phone_call', 'email', 'sms', 'field_visit', 'legal_action'] 
  },
  recoveryNotes: { type: String },
  recoveryAgent: { type: String },
  lastRecoveryAction: { type: Date },
  lastContactDate: { type: Date },
  lastContactMethod: { type: String },
  lastContactAgent: { type: String },
  contactNotes: { type: String },
  lastPaymentDate: { type: Date },
  lastPaymentAmount: { type: Number },
  paymentNotes: { type: String },
  escalationDate: { type: Date },
  escalationReason: { type: String },
  escalatedBy: { type: String },
  writeOffDate: { type: Date },
  writeOffReason: { type: String },
  writtenOffBy: { type: String }
}, {
  timestamps: true,
});

// Indexes for better query performance
LoanSchema.index({ customerId: 1 });
LoanSchema.index({ institutionId: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ riskLevel: 1 });
LoanSchema.index({ applicationDate: -1 });

// Clear any existing model to ensure fresh schema
if (mongoose.models.Loan) {
  delete mongoose.models.Loan;
}

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);