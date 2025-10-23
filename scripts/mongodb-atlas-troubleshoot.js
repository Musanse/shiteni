#!/usr/bin/env node

console.log('🔍 MongoDB Atlas Troubleshooting Guide\n');

console.log('Your current connection details:');
console.log('Username: zeedemypartners_db_user');
console.log('Password: GRvk0Kddj8p0PBUR');
console.log('Cluster: cluster0.n52xav4.mongodb.net');
console.log('Database: (default)\n');

console.log('❌ Authentication failed - Possible causes:\n');

console.log('1. USER DOESN\'T EXIST');
console.log('   - Go to MongoDB Atlas → Database Access');
console.log('   - Check if "zeedemypartners_db_user" exists');
console.log('   - If not, create it with the exact username\n');

console.log('2. WRONG PASSWORD');
console.log('   - Go to Database Access → Edit user');
console.log('   - Reset password to: GRvk0Kddj8p0PBUR');
console.log('   - Or generate new password and update .env.local\n');

console.log('3. NO PERMISSIONS');
console.log('   - Ensure user has "Read and write to any database"');
console.log('   - Or specific access to your database\n');

console.log('4. NETWORK ACCESS BLOCKED');
console.log('   - Go to Network Access');
console.log('   - Add IP: 0.0.0.0/0 (for development)');
console.log('   - Or add your specific IP address\n');

console.log('5. CLUSTER ISSUES');
console.log('   - Verify cluster "cluster0.n52xav4.mongodb.net" exists');
console.log('   - Check if cluster is running\n');

console.log('🔧 QUICK FIX STEPS:\n');

console.log('1. Go to https://cloud.mongodb.com');
console.log('2. Select your project');
console.log('3. Go to Database Access');
console.log('4. Either:');
console.log('   a) Edit existing user and reset password');
console.log('   b) Create new user with exact credentials');
console.log('5. Go to Network Access and add 0.0.0.0/0');
console.log('6. Test connection again\n');

console.log('🧪 After fixing, test with:');
console.log('node scripts/test-connection-simple.js\n');

console.log('✅ Expected success:');
console.log('✅ Successfully connected to MongoDB');
console.log('📋 Available databases: [list of databases]');
