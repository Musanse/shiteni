const { MongoClient } = require('mongodb');

async function testCustomerCreation() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    await client.connect();
    
    const db = client.db('shiteni');
    const customersCollection = db.collection('storecustomers');
    const ordersCollection = db.collection('storeorders');
    
    console.log('Testing automatic customer creation...');
    
    // Clear existing test data
    await customersCollection.deleteMany({ email: { $regex: /@customer\.com$/ } });
    await ordersCollection.deleteMany({ notes: 'Test order for customer creation' });
    console.log('Cleared existing test data');
    
    // Test data for order capture
    const testOrderData = {
      customerName: 'Test Customer',
      customerPhone: '+260123456789',
      customerEmail: 'test@customer.com',
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Product 1',
          quantity: 2,
          price: 100
        },
        {
          productId: 'test-product-2',
          name: 'Test Product 2',
          quantity: 1,
          price: 50
        }
      ],
      subtotal: 250,
      tax: 25,
      shipping: 10,
      discount: 0,
      total: 285,
      paymentMethod: 'cash',
      shippingAddress: {
        name: 'Test Customer',
        phone: '+260123456789',
        street: '123 Test Street',
        city: 'Lusaka',
        state: 'Lusaka',
        country: 'Zambia',
        zipCode: '10101'
      },
      notes: 'Test order for customer creation'
    };
    
    // Simulate order capture API call
    console.log('Simulating order capture...');
    
    // Create customer record (as done in the API)
    const customerEmail = testOrderData.shippingAddress.name.toLowerCase().replace(/\s+/g, '.') + '@customer.com';
    
    let customer = await customersCollection.findOne({ 
      $or: [
        { email: customerEmail },
        { phone: testOrderData.shippingAddress.phone }
      ]
    });

    if (!customer) {
      console.log('Creating new customer...');
      customer = {
        firstName: testOrderData.shippingAddress.name.split(' ')[0] || 'Customer',
        lastName: testOrderData.shippingAddress.name.split(' ').slice(1).join(' ') || 'Unknown',
        email: customerEmail,
        phone: testOrderData.shippingAddress.phone,
        address: {
          street: testOrderData.shippingAddress.street,
          city: testOrderData.shippingAddress.city,
          state: testOrderData.shippingAddress.state,
          country: testOrderData.shippingAddress.country,
          zipCode: testOrderData.shippingAddress.zipCode
        },
        preferences: {
          categories: [],
          brands: [],
          priceRange: { min: 0, max: 10000 }
        },
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const customerResult = await customersCollection.insertOne(customer);
      customer._id = customerResult.insertedId;
      console.log('Customer created with ID:', customer._id);
    } else {
      console.log('Customer already exists:', customer._id);
    }

    // Create order
    const orderCount = await ordersCollection.countDocuments();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;
    
    const order = {
      customerId: customer._id.toString(),
      orderNumber,
      items: testOrderData.items,
      subtotal: testOrderData.subtotal,
      tax: testOrderData.tax,
      shipping: testOrderData.shipping,
      discount: testOrderData.discount,
      total: testOrderData.total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: testOrderData.paymentMethod,
      shippingAddress: testOrderData.shippingAddress,
      billingAddress: testOrderData.shippingAddress,
      notes: testOrderData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const orderResult = await ordersCollection.insertOne(order);
    console.log('Order created with ID:', orderResult.insertedId);

    // Update customer statistics
    await customersCollection.updateOne(
      { _id: customer._id },
      {
        $inc: { 
          totalOrders: 1, 
          totalSpent: testOrderData.total,
          loyaltyPoints: Math.floor(testOrderData.total * 0.1)
        },
        $set: { lastOrder: new Date() }
      }
    );
    console.log('Customer statistics updated');

    // Verify results
    const updatedCustomer = await customersCollection.findOne({ _id: customer._id });
    const totalCustomers = await customersCollection.countDocuments();
    const totalOrders = await ordersCollection.countDocuments();
    
    console.log('\n=== Results ===');
    console.log('Total customers:', totalCustomers);
    console.log('Total orders:', totalOrders);
    console.log('Customer details:', {
      name: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      totalOrders: updatedCustomer.totalOrders,
      totalSpent: updatedCustomer.totalSpent,
      loyaltyPoints: updatedCustomer.loyaltyPoints
    });
    
    await client.close();
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing customer creation:', error);
  }
}

testCustomerCreation();
