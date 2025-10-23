// Test script to create an order and check if it gets stored
const { MongoClient } = require('mongodb');

async function testOrderCreation() {
  try {
    // Use the MongoDB URI from your env.example
    const uri = 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('shiteni');
    console.log('Connected to database: shiteni');
    
    // Check current collections
    const collections = await db.listCollections().toArray();
    console.log('\nExisting collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check storeorders collection
    const ordersCollection = db.collection('storeorders');
    const orderCount = await ordersCollection.countDocuments();
    console.log(`\nCurrent orders: ${orderCount}`);
    
    // Create a test order
    console.log('\nCreating test order...');
    const testOrder = {
      customerId: 'test-customer-123',
      orderNumber: 'ORD-TEST-001',
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Product',
          quantity: 2,
          price: 100,
          total: 200
        }
      ],
      subtotal: 200,
      tax: 20,
      shipping: 10,
      discount: 0,
      total: 230,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      shippingAddress: {
        name: 'Test Customer',
        street: '123 Test Street',
        city: 'Lusaka',
        state: 'Lusaka',
        country: 'Zambia',
        zipCode: '10101',
        phone: '+260123456789'
      },
      billingAddress: {
        name: 'Test Customer',
        street: '123 Test Street',
        city: 'Lusaka',
        state: 'Lusaka',
        country: 'Zambia',
        zipCode: '10101',
        phone: '+260123456789'
      },
      notes: 'Test order',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await ordersCollection.insertOne(testOrder);
    console.log('Test order created with ID:', result.insertedId);
    
    // Verify the order was created
    const newOrderCount = await ordersCollection.countDocuments();
    console.log(`Orders after test: ${newOrderCount}`);
    
    // Get the created order
    const createdOrder = await ordersCollection.findOne({ _id: result.insertedId });
    console.log('\nCreated order details:');
    console.log(`Order Number: ${createdOrder.orderNumber}`);
    console.log(`Customer: ${createdOrder.shippingAddress.name}`);
    console.log(`Total: ZMW ${createdOrder.total}`);
    console.log(`Status: ${createdOrder.status}`);
    
    await client.close();
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('authentication')) {
      console.log('\nAuthentication error - check your MongoDB credentials');
    } else if (error.message.includes('network')) {
      console.log('\nNetwork error - check your internet connection');
    }
  }
}

testOrderCreation();
