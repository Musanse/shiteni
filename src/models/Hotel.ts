import mongoose, { Document, Schema } from 'mongoose';

export interface IHotelRoom extends Document {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  amenities: string[];
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  description: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IHotelBooking extends Document {
  _id: string;
  roomId: string;
  customerId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  specialRequests: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHotelGuest extends Document {
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
  idType: string;
  idNumber: string;
  preferences: {
    roomType: string;
    floor: number;
    amenities: string[];
  };
  loyaltyPoints: number;
  totalBookings: number;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HotelRoomSchema = new Schema<IHotelRoom>({
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  floor: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  pricePerNight: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'out_of_order'], default: 'available' },
  description: { type: String },
  images: [{ type: String }]
}, {
  timestamps: true,
});

const HotelBookingSchema = new Schema<IHotelBooking>({
  roomId: { type: String, required: true },
  customerId: { type: String, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  specialRequests: { type: String },
  notes: { type: String }
}, {
  timestamps: true,
});

const HotelGuestSchema = new Schema<IHotelGuest>({
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
  idType: { type: String },
  idNumber: { type: String },
  preferences: {
    roomType: { type: String },
    floor: { type: Number },
    amenities: [{ type: String }]
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  lastVisit: { type: Date }
}, {
  timestamps: true,
});

export const HotelRoom = mongoose.models.HotelRoom || mongoose.model<IHotelRoom>('HotelRoom', HotelRoomSchema);
export const HotelBooking = mongoose.models.HotelBooking || mongoose.model<IHotelBooking>('HotelBooking', HotelBookingSchema);
export const HotelGuest = mongoose.models.HotelGuest || mongoose.model<IHotelGuest>('HotelGuest', HotelGuestSchema);
