import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  amenities: string[];
  price: number;
  maxGuests: number;
  description: string;
  lastCleaned?: string;
  nextMaintenance?: string;
  images: string[];
  featuredImage?: string;
  vendorId: string; // Reference to the hotel vendor
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  number: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'out-of-order'],
    default: 'available'
  },
  amenities: [{
    type: String
  }],
  price: {
    type: Number,
    required: true
  },
  maxGuests: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  lastCleaned: {
    type: String
  },
  nextMaintenance: {
    type: String
  },
  images: [{
    type: String
  }],
  featuredImage: {
    type: String
  },
  vendorId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
