import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not found. Running in demo mode without database.');
  console.warn('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
}

// 🚨 CRITICAL SAFETY CHECK: Prevent connection to test database
if (MONGODB_URI) {
  if (MONGODB_URI.includes('/test') || MONGODB_URI.includes('/test?')) {
    console.error('🚨 CRITICAL ERROR: MongoDB URI points to test database!');
    console.error('   This will cause data corruption and loss!');
    console.error('   URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    throw new Error('MongoDB URI points to test database - this is not allowed!');
  }
  
  if (!MONGODB_URI.includes('/shiteni')) {
    console.error('🚨 CRITICAL ERROR: MongoDB URI does not specify shiteni database!');
    console.error('   Expected: ...mongodb.net/shiteni?...');
    console.error('   Current:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    throw new Error('MongoDB URI must specify shiteni database!');
  }
  
  console.log('✅ MongoDB URI safety check passed - connecting to shiteni database');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️ MongoDB not configured. Some features may not work.');
    return null;
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    
    // 🚨 RUNTIME SAFETY CHECK: Verify we're connected to the correct database
    const dbName = cached!.conn.connection.db.databaseName;
    if (dbName !== 'shiteni') {
      console.error('🚨 CRITICAL ERROR: Connected to wrong database!');
      console.error(`   Expected: shiteni`);
      console.error(`   Actual: ${dbName}`);
      console.error('   Disconnecting immediately to prevent data corruption!');
      await cached!.conn.disconnect();
      throw new Error(`Connected to wrong database: ${dbName} instead of shiteni`);
    }
    
    console.log(`✅ Connected to correct database: ${dbName}`);
    
  } catch (e) {
    cached!.promise = null;
    console.error('❌ MongoDB connection failed:', e);
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
