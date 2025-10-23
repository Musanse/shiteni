#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing NextAuth API endpoints...\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testNextAuth() {
  try {
    console.log('1. 🔄 Testing server availability...');
    const sessionResponse = await makeRequest('/api/auth/session');
    
    console.log('✅ Server is running');
    console.log('Session endpoint status:', sessionResponse.status);
    console.log('Session data:', sessionResponse.data);
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('\n🔧 The server is not running. Please start it with:');
    console.log('npm run dev');
    return;
  }
  
  try {
    console.log('\n2. 🔄 Testing NextAuth providers...');
    const providersResponse = await makeRequest('/api/auth/providers');
    
    console.log('Providers endpoint status:', providersResponse.status);
    if (providersResponse.status === 200) {
      console.log('✅ NextAuth providers loaded');
      const providers = JSON.parse(providersResponse.data);
      console.log('Available providers:', Object.keys(providers));
    } else {
      console.log('❌ Providers endpoint failed');
    }
    
  } catch (error) {
    console.log('❌ Providers test failed:', error.message);
  }
  
  try {
    console.log('\n3. 🔄 Testing CSRF token...');
    const csrfResponse = await makeRequest('/api/auth/csrf');
    
    console.log('CSRF endpoint status:', csrfResponse.status);
    if (csrfResponse.status === 200) {
      console.log('✅ CSRF token available');
      const csrf = JSON.parse(csrfResponse.data);
      console.log('CSRF token:', csrf.csrfToken ? 'Present' : 'Missing');
    } else {
      console.log('❌ CSRF endpoint failed');
    }
    
  } catch (error) {
    console.log('❌ CSRF test failed:', error.message);
  }
  
  console.log('\n✅ NextAuth API tests completed');
  console.log('\n🚀 Next steps:');
  console.log('1. Open browser to: http://localhost:3000/auth/signin');
  console.log('2. Try logging in with: admin@mankuca.com / admin123');
  console.log('3. Check browser console for any JavaScript errors');
  console.log('4. Check Network tab for failed requests');
}

// Run the tests
testNextAuth();

