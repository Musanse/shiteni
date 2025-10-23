import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  adults: number;
  children: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  notes?: string;
  bookingSource?: 'online' | 'hotel'; // Track where booking was made
  vendorId: string; // Reference to the hotel vendor
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingNumber: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  roomType: {
    type: String,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String
  },
  specialRequests: {
    type: String
  },
  notes: {
    type: String
  },
  bookingSource: {
    type: String,
    enum: ['online', 'hotel'],
    default: 'hotel'
  },
  vendorId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique booking number
BookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    try {
      // Use the same model instance to avoid circular reference
      const BookingModel = this.constructor;
      const count = await BookingModel.countDocuments();
      this.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
      console.log('Generated booking number:', this.bookingNumber);
    } catch (error) {
      console.error('Error generating booking number:', error);
      // Fallback to timestamp-based booking number
      this.bookingNumber = `BK${Date.now()}`;
      console.log('Using fallback booking number:', this.bookingNumber);
    }
  }
  next();
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
