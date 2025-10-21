import mongoose from 'mongoose';

export interface IPayment {
  _id?: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'mobile_money' | 'crypto';
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId: string;
  processedAt: Date;
  processedBy: string;
  vendorId: string;
  refundAmount?: number;
  refundReason?: string;
  notes?: string;
  currency: string;
  fees: number;
  netAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>({
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  roomType: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'mobile_money', 'crypto'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: String,
    required: true
  },
  vendorId: {
    type: String,
    required: true,
    index: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: {
    type: String
  },
  notes: {
    type: String
  },
  currency: {
    type: String,
    default: 'USD'
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Generate transaction ID before saving
PaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    const count = await mongoose.models.Payment?.countDocuments() || 0;
    this.transactionId = `TXN${String(count + 1).padStart(9, '0')}`;
  }
  next();
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
