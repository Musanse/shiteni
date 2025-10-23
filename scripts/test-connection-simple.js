#!/usr/bin/env node

const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔍 Testing MongoDB connection...');
console.log('Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@'));

mongoose.connect(connectionString, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB');
  
  // List databases
  return mongoose.connection.db.admin().listDatabases();
})
.then(databases => {
  console.log('📋 Available databases:');
  databases.databases.forEach(db => {
    console.log(`   - ${db.name}`);
  });
  
  // Check if mankuca database exists
  const mankucaExists = databases.databases.some(db => db.name === 'mankuca');
  if (mankucaExists) {
    console.log('✅ mankuca database exists');
  } else {
    console.log('⚠️  mankuca database does not exist');
    console.log('🔧 You may need to create it or use a different database name');
  }
})
.catch(error => {
  console.error('❌ MongoDB connection failed:', error.message);
  
  if (error.message.includes('Authentication failed')) {
    console.error('\n🔧 Authentication failed. Possible solutions:');
    console.error('1. Check username and password in MongoDB Atlas');
    console.error('2. Reset the password for zeedemypartners_db_user');
    console.error('3. Verify user has proper permissions');
  }
})
.finally(() => {
  mongoose.disconnect();
  console.log('\n✅ Connection test completed');
});
