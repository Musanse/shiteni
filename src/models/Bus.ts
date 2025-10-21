import mongoose, { Document, Schema } from 'mongoose';

export interface IBusRoute extends Document {
  _id: string;
  routeName: string;
  routeNumber: string;
  origin: string;
  destination: string;
  distance: number; // in kilometers
  duration: number; // in minutes
  stops: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    arrivalTime: string;
    departureTime: string;
  }[];
  fare: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusSchedule extends Document {
  _id: string;
  tripId?: string; // Link to BusTrip
  routeId: string;
  busId: string;
  departureTime: string;
  arrivalTime: string;
  date: Date;
  totalSeats: number;
  availableSeats: number;
  fare: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  driverId: string;
  conductorId: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusBooking extends Document {
  _id: string;
  bookingNumber: string; // Unique booking reference
  scheduleId: string;
  customerId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seatNumber: string;
  boardingPoint: string;
  destinationPoint: string;
  boardingStop: string; // NEW: boarding stop name
  alightingStop: string; // NEW: alighting stop name
  fare: number;
  segmentFare: number; // NEW: fare for selected segments
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  bookingDate: Date;
  travelDate: Date;
  specialRequests: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusPassenger extends Document {
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
  idType: string;
  idNumber: string;
  preferences: {
    seatType: string;
    boardingPoint: string;
    frequentRoutes: string[];
  };
  loyaltyPoints: number;
  totalBookings: number;
  totalSpent: number;
  lastTravel: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BusRouteSchema = new Schema<IBusRoute>({
  routeName: { type: String, required: true },
  routeNumber: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  distance: { type: Number, required: true },
  duration: { type: Number, required: true },
  stops: [{
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    arrivalTime: { type: String, required: true },
    departureTime: { type: String, required: true }
  }],
  fare: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }
}, {
  timestamps: true,
});

const BusScheduleSchema = new Schema<IBusSchedule>({
  tripId: { type: String }, // Link to BusTrip
  routeId: { type: String, required: true },
  busId: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  date: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  fare: { type: Number, required: true },
  status: { type: String, enum: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'], default: 'scheduled' },
  driverId: { type: String },
  conductorId: { type: String },
  notes: { type: String }
}, {
  timestamps: true,
});

const BusBookingSchema = new Schema<IBusBooking>({
  bookingNumber: { type: String, required: true, unique: true }, // Unique booking reference
  scheduleId: { type: String, required: true },
  customerId: { type: String, required: true },
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true },
  passengerPhone: { type: String, required: true },
  seatNumber: { type: String, required: true },
  boardingPoint: { type: String, required: true },
  destinationPoint: { type: String, required: true },
  boardingStop: { type: String, required: true }, // NEW: boarding stop name
  alightingStop: { type: String, required: true }, // NEW: alighting stop name
  fare: { type: Number, required: true },
  segmentFare: { type: Number, required: true }, // NEW: fare for selected segments
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  bookingDate: { type: Date, required: true },
  travelDate: { type: Date, required: true },
  specialRequests: { type: String },
  notes: { type: String }
}, {
  timestamps: true,
});

const BusPassengerSchema = new Schema<IBusPassenger>({
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
  idType: { type: String },
  idNumber: { type: String },
  preferences: {
    seatType: { type: String },
    boardingPoint: { type: String },
    frequentRoutes: [{ type: String }]
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastTravel: { type: Date }
}, {
  timestamps: true,
});

export const BusRoute = mongoose.models.BusRoute || mongoose.model<IBusRoute>('BusRoute', BusRouteSchema);
export const BusSchedule = mongoose.models.BusSchedule || mongoose.model<IBusSchedule>('BusSchedule', BusScheduleSchema);
export const BusBooking = mongoose.models.BusBooking || mongoose.model<IBusBooking>('BusBooking', BusBookingSchema);
export const BusPassenger = mongoose.models.BusPassenger || mongoose.model<IBusPassenger>('BusPassenger', BusPassengerSchema);
