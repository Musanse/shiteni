import mongoose, { Document, Schema } from 'mongoose';

export interface IPharmacyMedicine extends Document {
  _id: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  dosage: string;
  form: string; // tablet, capsule, syrup, etc.
  strength: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
  stock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  sellingPrice: number;
  prescriptionRequired: boolean;
  controlledSubstance: boolean;
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPharmacyPrescription extends Document {
  _id: string;
  patientId: string;
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense: string;
  diagnosis: string;
  medicines: {
    medicineId: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'dispensed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  notes: string;
  dispensedAt?: Date;
  dispensedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPharmacyPatient extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    copay: number;
  };
  totalPrescriptions: number;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyMedicineSchema = new Schema<IPharmacyMedicine>({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  brandName: { type: String, required: true },
  category: { type: String, required: true },
  dosage: { type: String, required: true },
  form: { type: String, required: true },
  strength: { type: String, required: true },
  manufacturer: { type: String, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 1000 },
  cost: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  prescriptionRequired: { type: Boolean, default: false },
  controlledSubstance: { type: Boolean, default: false },
  sideEffects: [{ type: String }],
  contraindications: [{ type: String }],
  interactions: [{ type: String }],
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock', 'expired'], default: 'active' }
}, {
  timestamps: true,
});

const PharmacyPrescriptionSchema = new Schema<IPharmacyPrescription>({
  patientId: { type: String, required: true },
  prescriptionNumber: { type: String, required: true, unique: true },
  doctorName: { type: String, required: true },
  doctorLicense: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medicines: [{
    medicineId: { type: String, required: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    quantity: { type: Number, required: true },
    instructions: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'dispensed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  notes: { type: String },
  dispensedAt: { type: Date },
  dispensedBy: { type: String }
}, {
  timestamps: true,
});

const PharmacyPatientSchema = new Schema<IPharmacyPatient>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  emergencyContact: {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true }
  },
  medicalHistory: {
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    medications: [{ type: String }]
  },
  insurance: {
    provider: { type: String },
    policyNumber: { type: String },
    groupNumber: { type: String },
    copay: { type: Number }
  },
  totalPrescriptions: { type: Number, default: 0 },
  lastVisit: { type: Date }
}, {
  timestamps: true,
});

export const PharmacyMedicine = mongoose.models.PharmacyMedicine || mongoose.model<IPharmacyMedicine>('PharmacyMedicine', PharmacyMedicineSchema);
export const PharmacyPrescription = mongoose.models.PharmacyPrescription || mongoose.model<IPharmacyPrescription>('PharmacyPrescription', PharmacyPrescriptionSchema);
export const PharmacyPatient = mongoose.models.PharmacyPatient || mongoose.model<IPharmacyPatient>('PharmacyPatient', PharmacyPatientSchema);
