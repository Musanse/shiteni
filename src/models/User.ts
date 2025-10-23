import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '@/types/business';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name?: string; // Combined name for messaging
  businessName?: string; // Business name for vendors
  role: UserRole;
  phone?: string;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments?: {
    idDocument: string;
    proofOfAddress: string;
    incomeProof: string;
  };
  // Email verification fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // Staff-specific fields
  department?: string;
  permissions?: string[];
  location?: string;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  licenseNumber?: string;
  isActive?: boolean;
  salary?: number;
  shift?: string;
  performance?: string;
  // Vendor-specific fields
  serviceType?: 'hotel' | 'store' | 'pharmacy' | 'bus';
  businessId?: string;
  institutionId?: string;
  createdBy?: string;
  activatedAt?: Date;
  activatedBy?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  lastLogin?: Date;
  // Store settings fields
  storeName?: string;
  storeDescription?: string;
  storeCategory?: string;
  businessHours?: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  currency?: string;
  timezone?: string;
  language?: string;
  notifications?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderNotifications: boolean;
    inventoryNotifications: boolean;
    customerNotifications: boolean;
  };
  appearance?: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
  };
  security?: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
  };
  // Hotel-specific business information
  hotelName?: string;
  hotelDescription?: string;
  hotelCheckInTime?: string;
  hotelCheckOutTime?: string;
  hotelAmenities?: string[];
  hotelPolicies?: {
    cancellation: string;
    pets: string;
    smoking: string;
    ageRestriction: string;
  };
  hotelNotifications?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    bookingAlerts: boolean;
    paymentAlerts: boolean;
    maintenanceAlerts: boolean;
    guestMessages: boolean;
    systemUpdates: boolean;
  };
  hotelSecurity?: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    loginAttempts: number;
    ipWhitelist: string;
    auditLog: boolean;
  };
  hotelPaymentSettings?: {
    acceptedMethods: string[];
    processingFee: number;
    refundPolicy: string;
    taxRate: number;
    serviceCharge: number;
    currency: string;
  };
  hotelGalleryImages?: string[];
  // Bus-specific business information
  busCompanyName?: string;
  busDescription?: string;
  busOperatingHours?: {
    start: string;
    end: string;
  };
  busFeatures?: {
    onlineBooking: boolean;
    seatSelection: boolean;
    mobileApp: boolean;
    notifications: boolean;
    loyaltyProgram: boolean;
    groupBookings: boolean;
  };
  busPolicies?: {
    cancellationPolicy: string;
    refundPolicy: string;
    termsOfService: string;
    privacyPolicy: string;
  };
  busBranding?: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    companyImage: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String }, // Combined name for messaging
  businessName: { type: String }, // Business name for vendors
  role: { 
    type: String, 
    enum: [
      'customer', 'super_admin',
      // Hotel roles
      'receptionist', 'housekeeping', 'manager', 'admin',
      // Store roles
      'cashier', 'inventory_manager', 'sales_associate',
      // Pharmacy roles
      'pharmacist', 'technician', 'cashier',
      // Bus roles
      'driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance', 'admin'
    ], 
    required: true 
  },
  phone: { type: String },
  profilePicture: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  kycDocuments: {
    idDocument: String,
    proofOfAddress: String,
    incomeProof: String,
  },
  // Email verification fields
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  // Staff-specific fields
  department: { type: String },
  permissions: [{ type: String }],
  location: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'suspended'], default: 'active' },
  licenseNumber: { type: String },
  isActive: { type: Boolean, default: true },
  salary: { type: Number },
  shift: { type: String },
  performance: { type: String },
  // Vendor-specific fields
  serviceType: { type: String, enum: ['hotel', 'store', 'pharmacy', 'bus'] },
  businessId: { type: String },
  institutionId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: String },
  activatedAt: { type: Date },
  activatedBy: { type: String },
  deactivatedAt: { type: Date },
  deactivatedBy: { type: String },
  lastLogin: { type: Date },
  // Store settings fields
  storeName: { type: String },
  storeDescription: { type: String },
  storeCategory: { type: String },
  businessHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  currency: { type: String },
  timezone: { type: String },
  language: { type: String },
  notifications: {
    emailNotifications: { type: Boolean },
    smsNotifications: { type: Boolean },
    orderNotifications: { type: Boolean },
    inventoryNotifications: { type: Boolean },
    customerNotifications: { type: Boolean }
  },
  appearance: {
    primaryColor: { type: String },
    secondaryColor: { type: String },
    logo: { type: String },
    favicon: { type: String }
  },
  security: {
    twoFactorAuth: { type: Boolean },
    sessionTimeout: { type: Number },
    passwordPolicy: { type: String }
  },
  // Hotel-specific business fields
  hotelName: { type: String },
  hotelDescription: { type: String },
  hotelCheckInTime: { type: String },
  hotelCheckOutTime: { type: String },
  hotelAmenities: [{ type: String }],
  hotelPolicies: {
    cancellation: { type: String },
    pets: { type: String },
    smoking: { type: String },
    ageRestriction: { type: String }
  },
  hotelNotifications: {
    emailNotifications: { type: Boolean },
    smsNotifications: { type: Boolean },
    pushNotifications: { type: Boolean },
    bookingAlerts: { type: Boolean },
    paymentAlerts: { type: Boolean },
    maintenanceAlerts: { type: Boolean },
    guestMessages: { type: Boolean },
    systemUpdates: { type: Boolean }
  },
  hotelSecurity: {
    twoFactorAuth: { type: Boolean },
    sessionTimeout: { type: Number },
    passwordPolicy: { type: String },
    loginAttempts: { type: Number },
    ipWhitelist: { type: String },
    auditLog: { type: Boolean }
  },
  hotelPaymentSettings: {
    acceptedMethods: [{ type: String }],
    processingFee: { type: Number },
    refundPolicy: { type: String },
    taxRate: { type: Number },
    serviceCharge: { type: Number },
    currency: { type: String }
  },
  hotelGalleryImages: [{ type: String }],
  // Bus-specific business fields
  busCompanyName: { type: String },
  busDescription: { type: String },
  busOperatingHours: {
    start: { type: String },
    end: { type: String }
  },
  busFeatures: {
    onlineBooking: { type: Boolean },
    seatSelection: { type: Boolean },
    mobileApp: { type: Boolean },
    notifications: { type: Boolean },
    loyaltyProgram: { type: Boolean },
    groupBookings: { type: Boolean }
  },
  busPolicies: {
    cancellationPolicy: { type: String },
    refundPolicy: { type: String },
    termsOfService: { type: String },
    privacyPolicy: { type: String }
  },
  busBranding: {
    primaryColor: { type: String },
    secondaryColor: { type: String },
    logo: { type: String },
    companyImage: { type: String }
  },
}, {
  timestamps: true,
});

// Clear any existing model to ensure fresh schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User = mongoose.model<IUser>('User', UserSchema);
