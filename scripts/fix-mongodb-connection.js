#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Connection String Fix\n');

const envPath = path.join(__dirname, '..', '.env.local');

// Read current .env.local
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found .env.local file');
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

// Current connection string (with database name)
const currentString = 'mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/mankuca?retryWrites=true&w=majority&appName=Cluster0';

// New connection string (without database name)
const newString = 'mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('Current connection string:');
console.log(currentString);
console.log('\nNew connection string:');
console.log(newString);

// Update the content
const updatedContent = envContent.replace(
  /MONGODB_URI=".*"/,
  `MONGODB_URI="${newString}"`
);

// Write back to file
try {
  fs.writeFileSync(envPath, updatedContent, 'utf8');
  console.log('\n✅ Updated .env.local with new connection string');
  console.log('🔧 Removed database name from connection string');
  console.log('📋 MongoDB will now connect to the default database');
} catch (error) {
  console.error('❌ Could not update .env.local file:', error.message);
  process.exit(1);
}

console.log('\n🧪 Test the connection:');
console.log('node scripts/test-connection-simple.js');

console.log('\n🚀 Start the app:');
console.log('npm run dev');
