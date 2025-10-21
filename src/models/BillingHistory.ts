import mongoose, { Document, Schema } from 'mongoose';

export interface IBillingHistory extends Document {
  _id: string;
  userId: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  billingDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  paymentMethod?: 'card' | 'bank_transfer' | 'cash' | 'mobile_money';
  description: string;
  planType: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  // Lipila payment details
  lipilaTransactionId?: string;
  lipilaExternalId?: string;
  lipilaPaymentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingHistorySchema = new Schema<IBillingHistory>({
  userId: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  subscriptionId: { 
    type: String, 
    required: true,
    ref: 'Subscription'
  },
  invoiceNumber: { 
    type: String, 
    required: true,
    unique: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'ZMW' 
  },
  status: { 
    type: String, 
    enum: ['paid', 'pending', 'failed', 'refunded', 'cancelled'], 
    default: 'pending' 
  },
  billingDate: { 
    type: Date, 
    required: true 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  paymentDate: { 
    type: Date 
  },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'bank_transfer', 'cash', 'mobile_money'] 
  },
  description: { 
    type: String, 
    required: true 
  },
  planType: { 
    type: String, 
    required: true 
  },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'yearly'], 
    required: true 
  },
  // Lipila payment details
  lipilaTransactionId: { 
    type: String 
  },
  lipilaExternalId: { 
    type: String 
  },
  lipilaPaymentType: { 
    type: String 
  }
}, {
  timestamps: true,
});

// Create index for efficient queries
BillingHistorySchema.index({ institutionId: 1, billingDate: -1 });
// invoiceNumber index is already created by unique: true

export const BillingHistory = mongoose.models.BillingHistory || mongoose.model<IBillingHistory>('BillingHistory', BillingHistorySchema);
