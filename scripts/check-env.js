#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Quick check for required environment variables
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Environment Variables Check');
console.log('==============================\n');

const requiredVars = {
  'NEXTAUTH_SECRET': 'Required for NextAuth session security',
  'MONGODB_URI': 'Required for database connection',
  'NEXTAUTH_URL': 'Required for production deployments'
};

const optionalVars = {
  'NODE_ENV': 'Environment (development/production)',
  'SMTP_HOST': 'Email service host',
  'SMTP_PORT': 'Email service port',
  'SMTP_USER': 'Email service username',
  'SMTP_PASS': 'Email service password',
  'SMTP_FROM': 'From email address'
};

console.log('📋 Required Variables:');
console.log('----------------------');
let allRequiredPresent = true;

Object.entries(requiredVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName === 'MONGODB_URI' ? '[HIDDEN]' : '[SET]';
    console.log(`✅ ${varName}: ${displayValue}`);
    console.log(`   ${description}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    console.log(`   ${description}`);
    allRequiredPresent = false;
  }
  console.log('');
});

console.log('📋 Optional Variables:');
console.log('----------------------');
Object.entries(optionalVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  console.log(`${value ? '✅' : '⚠️'} ${varName}: ${value || 'NOT SET'}`);
  console.log(`   ${description}`);
  console.log('');
});

console.log('📊 Summary:');
console.log('===========');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set');
  console.log('🎉 Your application should work properly');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('🚨 This will cause authentication and other issues');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('1. Create or update your .env.local file');
  console.log('2. Add the missing variables');
  console.log('3. Restart your development server');
  console.log('');
  console.log('📝 Example .env.local file:');
  console.log('NEXTAUTH_SECRET=your-secret-key-here');
  console.log('MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname');
  console.log('NEXTAUTH_URL=http://localhost:3000');
}

console.log('\n🔍 For detailed debugging, run:');
console.log('   node scripts/debug-auth-401.js');