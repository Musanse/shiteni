#!/usr/bin/env node

/**
 * Check which database the application is actually connecting to
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function checkDatabase() {
  console.log('🔍 Database Connection Check');
  console.log('============================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  console.log('MongoDB URI:', mongoUri ? '[HIDDEN]' : 'NOT SET');
  
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log('✅ Connected successfully');
    console.log('📊 Database name:', dbName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });
    
    // Check if it's the right database
    if (dbName === 'mankuca') {
      console.log('✅ Correct database: mankuca');
    } else {
      console.log('❌ Wrong database! Expected: mankuca, Got:', dbName);
      console.log('💡 This is why your app might be using the wrong database');
    }
    
    await mongoose.disconnect();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

checkDatabase();
