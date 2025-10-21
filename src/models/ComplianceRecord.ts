import mongoose, { Document, Schema } from 'mongoose';

export interface IComplianceRecord extends Document {
  recordId: string;
  type: 'license_renewal' | 'inspection' | 'audit' | 'training' | 'certification' | 'other';
  title: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  responsiblePerson: string;
  documents: string[];
  notes?: string;
  pharmacyId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceRecordSchema = new Schema({
  recordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['license_renewal', 'inspection', 'audit', 'training', 'certification', 'other']
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  completedDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'overdue', 'cancelled'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    required: true 
  },
  assignedTo: { 
    type: String, 
    default: '' 
  },
  responsiblePerson: { 
    type: String, 
    required: true 
  },
  documents: [{ 
    type: String 
  }],
  notes: { 
    type: String 
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

// Generate record ID before saving
ComplianceRecordSchema.pre('save', function(next) {
  if (this.isNew && !this.recordId) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Generate a unique record ID
    const timestamp = Date.now().toString().slice(-6);
    this.recordId = `CR${year}${month}${day}${timestamp}`;
  }
  
  this.updatedAt = new Date();
  next();
});

const ComplianceRecord = mongoose.models.ComplianceRecord || mongoose.model<IComplianceRecord>('ComplianceRecord', ComplianceRecordSchema);
export default ComplianceRecord;
