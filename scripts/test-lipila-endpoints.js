const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testLipilaEndpoints() {
  const baseUrl = process.env.LIPILA_BASE_URL;
  const secretKey = process.env.LIPILA_SECRET_KEY;
  
  console.log('Testing different Lipila API endpoints...');
  console.log('Base URL:', baseUrl);
  console.log('Secret Key:', secretKey ? 'SET' : 'NOT SET');

  const testPayload = {
    amount: 2.00,
    currency: 'ZMW',
    description: 'Test payment',
    customer_email: 'test@example.com',
    customer_name: 'Test User',
    customer_phone: '0977123456',
    payment_method: 'mobile_money'
  };

  const endpoints = [
    '/api/v1/payments',
    '/api/payments',
    '/payments',
    '/api/v1/checkout',
    '/api/checkout',
    '/checkout',
    '/api/v1/transaction',
    '/api/transaction',
    '/transaction',
    '/api/v1/mobile-money',
    '/api/mobile-money',
    '/mobile-money'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      
      const response = await axios.post(
        `${baseUrl}${endpoint}`,
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`✅ SUCCESS: ${endpoint}`);
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      break; // Stop on first success

    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log(`❌ ${endpoint}: Connection failed`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  // Also test GET endpoints
  console.log('\n🔍 Testing GET endpoints...');
  const getEndpoints = [
    '/api/v1/status',
    '/api/status',
    '/status',
    '/api/v1/health',
    '/api/health',
    '/health'
  ];

  for (const endpoint of getEndpoints) {
    try {
      console.log(`\n🔍 Testing GET: ${endpoint}`);
      
      const response = await axios.get(
        `${baseUrl}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`✅ SUCCESS: ${endpoint}`);
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      break;

    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

testLipilaEndpoints();
