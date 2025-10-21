import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  medicineId: mongoose.Schema.Types.ObjectId;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  instructions?: string;
}

export interface IPharmacyOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Schema.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: IOrderItem[];
  orderType: 'online' | 'walk-in';
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  notes?: string;
  orderDate: Date;
  confirmedDate?: Date;
  readyDate?: Date;
  completedDate?: Date;
  pharmacyId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, required: true },
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  dosage: { type: String },
  instructions: { type: String }
});

const CustomerAddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const PharmacyOrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String },
  customerAddress: CustomerAddressSchema,
  items: [OrderItemSchema],
  orderType: { 
    type: String, 
    enum: ['online', 'walk-in'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer'] 
  },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shippingFee: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: { type: String },
  orderDate: { type: Date, required: true },
  confirmedDate: { type: Date },
  readyDate: { type: Date },
  completedDate: { type: Date },
  pharmacyId: { type: Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PharmacyOrder = mongoose.models.PharmacyOrder || mongoose.model<IPharmacyOrder>('PharmacyOrder', PharmacyOrderSchema);

export default PharmacyOrder;
