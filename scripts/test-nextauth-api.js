#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('🔍 Testing NextAuth API endpoints...\n');

async function testNextAuth() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('1. 🔄 Testing server availability...');
    const response = await fetch(`${baseUrl}/api/auth/session`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is running');
      console.log('Session data:', data);
    } else {
      console.log('❌ Server responded with status:', response.status);
      console.log('Response:', await response.text());
    }
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Server is not running - start with: npm run dev');
    console.log('2. Port 3000 is blocked or in use');
    console.log('3. Firewall is blocking the connection');
    console.log('4. NextAuth configuration issue');
  }
  
  try {
    console.log('\n2. 🔄 Testing NextAuth providers...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    
    if (providersResponse.ok) {
      const providers = await providersResponse.json();
      console.log('✅ NextAuth providers loaded');
      console.log('Available providers:', Object.keys(providers));
    } else {
      console.log('❌ Providers endpoint failed:', providersResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Providers test failed:', error.message);
  }
  
  try {
    console.log('\n3. 🔄 Testing CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    
    if (csrfResponse.ok) {
      const csrf = await csrfResponse.json();
      console.log('✅ CSRF token available');
      console.log('CSRF token:', csrf.csrfToken ? 'Present' : 'Missing');
    } else {
      console.log('❌ CSRF endpoint failed:', csrfResponse.status);
    }
    
  } catch (error) {
    console.log('❌ CSRF test failed:', error.message);
  }
  
  console.log('\n✅ NextAuth API tests completed');
  console.log('\n🚀 Next steps:');
  console.log('1. Make sure the server is running: npm run dev');
  console.log('2. Open browser to: http://localhost:3000/auth/signin');
  console.log('3. Try logging in with: admin@mankuca.com / admin123');
  console.log('4. Check browser console for any JavaScript errors');
}

// Run the tests
testNextAuth();

