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

async function checkRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms in database:`);
    
    rooms.forEach((room, index) => {
      console.log(`\nRoom ${index + 1}:`);
      console.log(`  ID: ${room._id}`);
      console.log(`  Number: ${room.number}`);
      console.log(`  Type: ${room.type}`);
      console.log(`  Images: ${JSON.stringify(room.images)}`);
      console.log(`  Featured Image: ${room.featuredImage}`);
      console.log(`  Vendor ID: ${room.vendorId}`);
      console.log(`  Created: ${room.createdAt}`);
    });

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkRooms();
