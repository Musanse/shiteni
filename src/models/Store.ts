import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreProduct extends Document {
  _id: string;
  vendorId: mongoose.Schema.Types.ObjectId; // Link to specific vendor
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  price: number;
  originalPrice?: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  images: string[];
  imageUrl?: string;
  specifications: Record<string, any>;
  tags: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  rating: number;
  reviewCount: number;
  supplier: string;
  supplierLocation: string;
  minOrderQuantity: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreOrder extends Document {
  _id: string;
  customerId: string;
  orderNumber: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreCustomer extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  dateOfBirth: Date;
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StoreProductSchema = new Schema<IStoreProduct>({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to specific vendor
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  cost: { type: Number, required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 1000 },
  images: [{ type: String }],
  imageUrl: { type: String },
  specifications: { type: Schema.Types.Mixed },
  tags: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  supplier: { type: String, default: 'Shiteni Store' },
  supplierLocation: { type: String, default: 'Global' },
  minOrderQuantity: { type: Number, default: 1 },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
});

const StoreOrderSchema = new Schema<IStoreOrder>({
  customerId: { type: String, required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  shipping: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  billingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  notes: { type: String }
}, {
  timestamps: true,
});

const StoreCustomerSchema = new Schema<IStoreCustomer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  dateOfBirth: { type: Date },
  preferences: {
    categories: [{ type: String }],
    brands: [{ type: String }],
    priceRange: {
      min: { type: Number },
      max: { type: Number }
    }
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrder: { type: Date }
}, {
  timestamps: true,
});

export const StoreProduct = mongoose.models.StoreProduct || mongoose.model<IStoreProduct>('StoreProduct', StoreProductSchema);
export const StoreOrder = mongoose.models.StoreOrder || mongoose.model<IStoreOrder>('StoreOrder', StoreOrderSchema);
export const StoreCustomer = mongoose.models.StoreCustomer || mongoose.model<IStoreCustomer>('StoreCustomer', StoreCustomerSchema);
