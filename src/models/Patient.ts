import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IPatientEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface IPatientMedicalHistory {
  condition: string;
  diagnosisDate: Date;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface IPatientAllergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface IPatientCurrentMedication {
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  prescribedBy: string;
}

export interface IPatientInsuranceInfo {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  expiryDate?: Date;
}

export interface IPatient extends Document {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: IPatientAddress;
  emergencyContact: IPatientEmergencyContact;
  medicalHistory: IPatientMedicalHistory[];
  allergies: IPatientAllergy[];
  currentMedications: IPatientCurrentMedication[];
  insuranceInfo: IPatientInsuranceInfo;
  pharmacyId: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientAddressSchema = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
});

const PatientEmergencyContactSchema = new Schema({
  name: { type: String },
  relationship: { type: String },
  phone: { type: String }
});

const PatientMedicalHistorySchema = new Schema({
  condition: { type: String, required: true },
  diagnosisDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'chronic'], 
    default: 'active' 
  },
  notes: { type: String }
});

const PatientAllergySchema = new Schema({
  allergen: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['mild', 'moderate', 'severe'], 
    default: 'mild' 
  },
  notes: { type: String }
});

const PatientCurrentMedicationSchema = new Schema({
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  prescribedBy: { type: String, required: true }
});

const PatientInsuranceInfoSchema = new Schema({
  provider: { type: String },
  policyNumber: { type: String },
  groupNumber: { type: String },
  expiryDate: { type: Date }
});

const PatientSchema = new Schema({
  patientId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true 
  },
  address: PatientAddressSchema,
  emergencyContact: PatientEmergencyContactSchema,
  medicalHistory: [PatientMedicalHistorySchema],
  allergies: [PatientAllergySchema],
  currentMedications: [PatientCurrentMedicationSchema],
  insuranceInfo: PatientInsuranceInfoSchema,
  pharmacyId: { type: Schema.Types.ObjectId, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Patient = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
