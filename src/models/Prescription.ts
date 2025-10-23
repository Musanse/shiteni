import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionMedicine {
  medicineId: mongoose.Schema.Types.ObjectId;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

export interface IPrescription extends Document {
  prescriptionNumber: string;
  patientId: mongoose.Schema.Types.ObjectId;
  patientName: string;
  doctorName: string;
  doctorLicense: string;
  medicines: IPrescriptionMedicine[];
  diagnosis: string;
  notes?: string;
  status: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  prescribedDate: Date;
  expiryDate: Date;
  dispensedDate?: Date;
  prescriptionType: 'online' | 'physical';
  totalAmount?: number;
  pharmacyId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionMedicineSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  quantity: { type: Number, required: true },
  instructions: { type: String, required: true }
});

const PrescriptionSchema = new Schema({
  prescriptionNumber: { type: String, required: true, unique: true },
  patientId: { type: Schema.Types.ObjectId, required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorLicense: { type: String, required: true },
  medicines: [PrescriptionMedicineSchema],
  diagnosis: { type: String, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'dispensed', 'cancelled', 'expired'], 
    default: 'pending' 
  },
  prescribedDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  dispensedDate: { type: Date },
  prescriptionType: { 
    type: String, 
    enum: ['online', 'physical'], 
    required: true 
  },
  totalAmount: { type: Number, default: 0 },
  pharmacyId: { type: Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Prescription = mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

export default Prescription;
