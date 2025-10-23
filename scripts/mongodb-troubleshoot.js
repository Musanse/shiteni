#!/usr/bin/env node

/**
 * MongoDB Connection String Generator
 * 
 * This script helps generate a correct MongoDB connection string
 * for local development.
 */

console.log('🔧 MongoDB Connection String Generator\n');

console.log('Current connection string:');
console.log('mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/mankuca?retryWrites=true&w=majority&appName=Cluster0\n');

console.log('❌ This connection string is failing with "bad auth : Authentication failed"\n');

console.log('🔧 Possible fixes:\n');

console.log('1. Check MongoDB Atlas Dashboard:');
console.log('   - Go to https://cloud.mongodb.com');
console.log('   - Check Database Access → zeedemypartners_db_user');
console.log('   - Verify password is correct\n');

console.log('2. Reset the password:');
console.log('   - Go to Database Access');
console.log('   - Click Edit on zeedemypartners_db_user');
console.log('   - Generate new password');
console.log('   - Update .env.local\n');

console.log('3. Create new database user:');
console.log('   - Go to Database Access');
console.log('   - Add New Database User');
console.log('   - Username: mankuca_user');
console.log('   - Password: [generate secure password]');
console.log('   - Database User Privileges: Read and write to any database\n');

console.log('4. Check Network Access:');
console.log('   - Go to Network Access');
console.log('   - Add IP Address: 0.0.0.0/0 (for development)');
console.log('   - Or add your specific IP address\n');

console.log('5. Verify Database Name:');
console.log('   - Check if "mankuca" database exists');
console.log('   - If not, create it or use existing database name\n');

console.log('📋 After fixing, update .env.local:');
console.log('MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@cluster0.n52xav4.mongodb.net/mankuca?retryWrites=true&w=majority&appName=Cluster0"\n');

console.log('🧪 Test the connection:');
console.log('node scripts/test-mongodb-connection.js\n');

console.log('✅ Expected output:');
console.log('✅ Successfully connected to MongoDB');
console.log('✅ Admin user already exists (or created)');
console.log('✅ Password validation: PASSED');
