#!/usr/bin/env node

const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔍 Testing MongoDB connection with your exact string...');
console.log('Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@'));
console.log('Username: zeedemypartners_db_user');
console.log('Password: GRvk0Kddj8p0PBUR');
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
    console.error('1. User "zeedemypartners_db_user" does not exist in MongoDB Atlas');
    console.error('2. Password "GRvk0Kddj8p0PBUR" is incorrect');
    console.error('3. User exists but has no permissions');
    console.error('\n🔧 To fix this:');
    console.error('1. Go to https://cloud.mongodb.com');
    console.error('2. Navigate to Database Access');
    console.error('3. Create user "zeedemypartners_db_user" with password "GRvk0Kddj8p0PBUR"');
    console.error('4. Grant "Read and write to any database" permissions');
    console.error('5. Go to Network Access and add 0.0.0.0/0');
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
