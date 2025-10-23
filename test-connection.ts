import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('MONGODB_URI:', MONGODB_URI ? 'Found' : 'Not found');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 second timeout
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 15000, // 15 seconds
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test a simple operation
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    console.log('🏓 Ping result:', result);
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
