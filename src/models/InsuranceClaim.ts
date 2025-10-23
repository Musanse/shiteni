import mongoose, { Document, Schema } from 'mongoose';

export interface IInsuranceClaim extends Document {
  claimNumber: string;
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  submissionDate: Date;
  processedDate?: Date;
  notes?: string;
  attachments: string[];
  pharmacyId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceClaimSchema = new Schema({
  claimNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  patientId: { 
    type: String, 
    required: true 
  },
  patientName: { 
    type: String, 
    required: true 
  },
  insuranceProvider: { 
    type: String, 
    required: true,
    enum: ['nhima', 'medlife', 'zambia_national', 'other']
  },
  policyNumber: { 
    type: String, 
    required: true 
  },
  claimAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  approvedAmount: { 
    type: Number, 
    min: 0 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'processing'], 
    default: 'pending' 
  },
  submissionDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  processedDate: { 
    type: Date 
  },
  notes: { 
    type: String 
  },
  attachments: [{ 
    type: String 
  }],
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

const InsuranceClaim = mongoose.models.InsuranceClaim || mongoose.model<IInsuranceClaim>('InsuranceClaim', InsuranceClaimSchema);
export default InsuranceClaim;
