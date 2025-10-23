const { MongoClient } = require('mongodb');

async function addSampleCustomers() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    await client.connect();
    
    const db = client.db('shiteni');
    const customersCollection = db.collection('storecustomers');
    
    console.log('Adding sample customers...');
    
    const sampleCustomers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+260123456789',
        address: {
          street: '123 Main St',
          city: 'Lusaka',
          state: 'Lusaka',
          country: 'Zambia',
          zipCode: '10101'
        },
        dateOfBirth: new Date('1990-05-15'),
        preferences: {
          categories: ['Electronics', 'Gadgets'],
          brands: ['Samsung', 'Apple'],
          priceRange: { min: 100, max: 1000 }
        },
        loyaltyPoints: 250,
        totalOrders: 5,
        totalSpent: 1250.50,
        lastOrder: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 2592000000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+260987654321',
        address: {
          street: '456 Oak Ave',
          city: 'Ndola',
          state: 'Copperbelt',
          country: 'Zambia',
          zipCode: '20101'
        },
        dateOfBirth: new Date('1985-12-03'),
        preferences: {
          categories: ['Clothing', 'Accessories'],
          brands: ['Nike', 'Adidas'],
          priceRange: { min: 50, max: 500 }
        },
        loyaltyPoints: 150,
        totalOrders: 3,
        totalSpent: 750.25,
        lastOrder: new Date(Date.now() - 172800000),
        createdAt: new Date(Date.now() - 5184000000),
        updatedAt: new Date(Date.now() - 172800000)
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        phone: '+260555123456',
        address: {
          street: '789 Pine St',
          city: 'Kitwe',
          state: 'Copperbelt',
          country: 'Zambia',
          zipCode: '30101'
        },
        dateOfBirth: new Date('1992-08-20'),
        preferences: {
          categories: ['Home & Garden', 'Tools'],
          brands: ['Bosch', 'Makita'],
          priceRange: { min: 200, max: 2000 }
        },
        loyaltyPoints: 75,
        totalOrders: 2,
        totalSpent: 450.00,
        lastOrder: new Date(Date.now() - 345600000),
        createdAt: new Date(Date.now() - 7776000000),
        updatedAt: new Date(Date.now() - 345600000)
      }
    ];
    
    // Clear existing customers first
    await customersCollection.deleteMany({});
    console.log('Cleared existing customers');
    
    // Insert sample customers
    const result = await customersCollection.insertMany(sampleCustomers);
    console.log(`Inserted ${result.insertedCount} sample customers`);
    
    // Verify insertion
    const count = await customersCollection.countDocuments();
    console.log(`Total customers in database: ${count}`);
    
    await client.close();
    console.log('Sample customers added successfully!');
  } catch (error) {
    console.error('Error adding sample customers:', error);
  }
}

addSampleCustomers();
