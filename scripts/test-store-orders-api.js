const { MongoClient } = require('mongodb');

async function testStoreOrdersAPI() {
  try {
    console.log('Testing Store Orders API...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3001/api/store/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Store Orders API is working correctly');
      console.log(`Found ${data.orders?.length || 0} orders`);
    } else {
      console.log('❌ Store Orders API returned error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing Store Orders API:', error.message);
  }
}

// Run the test
testStoreOrdersAPI();
