const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testLipilaAPI() {
  try {
    console.log('Testing Lipila API connection...');
    console.log('Environment variables:');
    console.log('- LIPILA_BASE_URL:', process.env.LIPILA_BASE_URL);
    console.log('- LIPILA_SECRET_KEY:', process.env.LIPILA_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('- LIPILA_CURRENCY:', process.env.LIPILA_CURRENCY);

    const testPayload = {
      amount: 2.00,
      currency: 'ZMW',
      description: 'Test payment for store subscription',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      customer_phone: '0977123456',
      payment_method: 'mobile_money',
      callback_url: 'https://example.com/callback',
      success_url: 'https://example.com/success',
      failure_url: 'https://example.com/failure'
    };

    console.log('\nSending test request to Lipila API...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await axios.post(
      `${process.env.LIPILA_BASE_URL}/api/v1/payments`,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LIPILA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Lipila API Response:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Lipila API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    console.error('Full Error:', error);
  }
}

testLipilaAPI();
