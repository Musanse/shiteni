import mongoose, { Document, Schema } from 'mongoose';

export interface IPharmacyStaff extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'pharmacist' | 'technician' | 'cashier' | 'admin';
  department: string;
  licenseNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  hireDate: Date;
  lastLogin?: Date;
  pharmacyId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyStaffSchema = new Schema({
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['pharmacist', 'technician', 'cashier', 'admin']
  },
  department: { 
    type: String, 
    required: true 
  },
  licenseNumber: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  permissions: [{ 
    type: String 
  }],
  hireDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  pharmacyId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
PharmacyStaffSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const PharmacyStaff = mongoose.models.PharmacyStaff || mongoose.model<IPharmacyStaff>('PharmacyStaff', PharmacyStaffSchema);
export default PharmacyStaff;
