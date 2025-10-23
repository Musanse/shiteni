const { MongoClient } = require('mongodb');

async function checkOrdersDirectly() {
  try {
    // Use the same connection string from your .env.local
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni';
    console.log('Connecting to:', uri);
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('shiteni');
    console.log('Connected to database: shiteni');
    
    // Check storeorders collection
    const ordersCollection = db.collection('storeorders');
    const orderCount = await ordersCollection.countDocuments();
    console.log(`\nStore Orders: ${orderCount} documents`);
    
    if (orderCount > 0) {
      console.log('\nRecent orders:');
      const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderNumber} - ${order.status} - ZMW ${order.total}`);
      });
    }
    
    // Check storecustomers collection
    const customersCollection = db.collection('storecustomers');
    const customerCount = await customersCollection.countDocuments();
    console.log(`\nStore Customers: ${customerCount} documents`);
    
    if (customerCount > 0) {
      console.log('\nRecent customers:');
      const customers = await customersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
      customers.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} - ${customer.email}`);
      });
    }
    
    // Check storeproducts collection
    const productsCollection = db.collection('storeproducts');
    const productCount = await productsCollection.countDocuments();
    console.log(`\nStore Products: ${productCount} documents`);
    
    await client.close();
    console.log('\nDatabase check completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure your MONGODB_URI is correct in .env.local');
  }
}

checkOrdersDirectly();
