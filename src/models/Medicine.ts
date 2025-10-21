import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosage?: string;
  form: string;
  strength?: string;
  price: number;
  stock: number;
  minStock: number;
  expiryDate: Date;
  batchNumber: string;
  prescriptionRequired: boolean;
  status: 'active' | 'inactive' | 'expired' | 'low_stock';
  description?: string;
  sideEffects: string[];
  contraindications: string[];
  images: string[];
  vendorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['antibiotic', 'painkiller', 'vitamin', 'supplement', 'chronic', 'emergency', 'other']
  },
  dosage: {
    type: String,
    trim: true
  },
  form: {
    type: String,
    required: true,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler']
  },
  strength: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  minStock: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'low_stock'],
    default: 'active'
  },
  description: {
    type: String,
    trim: true
  },
  sideEffects: [{
    type: String,
    trim: true
  }],
  contraindications: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  vendorId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
MedicineSchema.index({ name: 1, batchNumber: 1 });
MedicineSchema.index({ category: 1 });
MedicineSchema.index({ status: 1 });
MedicineSchema.index({ vendorId: 1 });
MedicineSchema.index({ expiryDate: 1 });

// Pre-save middleware to update status based on stock and expiry
MedicineSchema.pre('save', function(next) {
  const today = new Date();
  
  if (this.expiryDate < today) {
    this.status = 'expired';
  } else if (this.stock <= this.minStock) {
    this.status = 'low_stock';
  } else if (this.status === 'expired' || this.status === 'low_stock') {
    this.status = 'active';
  }
  
  next();
});

const Medicine = mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
export default Medicine;
