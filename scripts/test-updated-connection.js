#!/usr/bin/env node

const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://zeedemypartners_db:3AppIBO7giz76JLn@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔍 Testing updated MongoDB connection...');
console.log('Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@'));
console.log('Username: zeedemypartners_db');
console.log('Password: 3AppIBO7giz76JLn');
console.log('Cluster: cluster0.n52xav4.mongodb.net\n');

mongoose.connect(connectionString, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB!');
  
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
    console.log('🔧 MongoDB will create it automatically when needed');
  }
})
.catch(error => {
  console.error('❌ MongoDB connection failed:', error.message);
  
  if (error.message.includes('Authentication failed')) {
    console.error('\n🔧 Authentication failed. This means:');
    console.error('1. User "zeedemypartners_db" does not exist in MongoDB Atlas');
    console.error('2. Password "3AppIBO7giz76JLn" is incorrect');
    console.error('3. User exists but has no permissions');
  } else if (error.message.includes('ENOTFOUND')) {
    console.error('\n🔧 Network error. This means:');
    console.error('1. Cluster "cluster0.n52xav4.mongodb.net" does not exist');
    console.error('2. Network access is blocked');
    console.error('3. Check your MongoDB Atlas project');
  }
})
.finally(() => {
  mongoose.disconnect();
  console.log('\n✅ Connection test completed');
});
