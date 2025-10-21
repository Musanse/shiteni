const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Booking schema
const BookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  roomId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  specialRequests: { type: String },
  notes: { type: String },
  vendorId: { type: String, required: true }
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings in database:`);
    
    bookings.forEach((booking, index) => {
      console.log(`\nBooking ${index + 1}:`);
      console.log(`  ID: ${booking._id}`);
      console.log(`  Booking Number: ${booking.bookingNumber}`);
      console.log(`  Customer: ${booking.customerName}`);
      console.log(`  Room: ${booking.roomNumber} (${booking.roomType})`);
      console.log(`  Check-in: ${booking.checkIn}`);
      console.log(`  Check-out: ${booking.checkOut}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Payment Status: ${booking.paymentStatus}`);
      console.log(`  Total Amount: $${booking.totalAmount}`);
      console.log(`  Vendor ID: ${booking.vendorId}`);
      console.log(`  Created: ${booking.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkBookings();
