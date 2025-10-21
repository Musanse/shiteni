const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Room schema
const RoomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  floor: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'out-of-order'], default: 'available' },
  amenities: [{ type: String }],
  price: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  description: { type: String, default: '' },
  lastCleaned: { type: String },
  nextMaintenance: { type: String },
  images: [{ type: String }],
  featuredImage: { type: String },
  vendorId: { type: String, required: true }
}, { timestamps: true });

const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

async function cleanRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all rooms
    const result = await Room.deleteMany({});
    console.log(`Deleted ${result.deletedCount} rooms from database`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanRooms();
