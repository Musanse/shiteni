// Local MongoDB test script
const { MongoClient } = require('mongodb');

async function testLocalMongoDB() {
  try {
    console.log('Testing local MongoDB connection...');
    
    // Try local MongoDB first
    const localUri = 'mongodb://localhost:27017/shiteni';
    const client = new MongoClient(localUri);
    
    await client.connect();
    console.log('✅ Connected to local MongoDB');
    
    const db = client.db('shiteni');
    const ordersCollection = db.collection('storeorders');
    
    // Check existing orders
    const count = await ordersCollection.countDocuments();
    console.log(`📊 Current orders in local DB: ${count}`);
    
    if (count > 0) {
      const orders = await ordersCollection.find({}).limit(3).toArray();
      console.log('\nRecent orders:');
      orders.forEach(order => {
        console.log(`- ${order.orderNumber}: ${order.status} (ZMW ${order.total})`);
      });
    }
    
    await client.close();
    console.log('✅ Local MongoDB test completed');
    
  } catch (error) {
    console.log('❌ Local MongoDB not available:', error.message);
    console.log('\nTo install local MongoDB:');
    console.log('1. Download MongoDB Community Server');
    console.log('2. Install and start MongoDB service');
    console.log('3. Or use Docker: docker run -d -p 27017:27017 mongo');
  }
}

testLocalMongoDB();
