#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Updating .env.local with new MongoDB connection string\n');

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

// New connection string
const newString = 'mongodb+srv://zeedemypartners_db:3AppIBO7giz76JLn@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('New connection string:');
console.log(newString);

// Update the content
const updatedContent = envContent.replace(
  /MONGODB_URI=".*"/,
  `MONGODB_URI="${newString}"`
);

// Write back to file
try {
  fs.writeFileSync(envPath, updatedContent, 'utf8');
  console.log('\n✅ Updated .env.local with new MongoDB connection string');
  console.log('🔧 Username: zeedemypartners_db');
  console.log('🔧 Password: 3AppIBO7giz76JLn');
  console.log('🔧 Database: mankuca (exists)');
} catch (error) {
  console.error('❌ Could not update .env.local file:', error.message);
  process.exit(1);
}

console.log('\n🧪 Test the connection:');
console.log('node scripts/test-updated-connection.js');

console.log('\n🚀 Start the app:');
console.log('npm run dev');

console.log('\n✅ Expected result:');
console.log('✅ MongoDB connection successful');
console.log('✅ Login should work now');
console.log('✅ No more 401 authentication errors');
