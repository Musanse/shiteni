const { MongoClient } = require('mongodb');

async function addSampleProducts() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    await client.connect();
    
    const db = client.db('shiteni');
    const productsCollection = db.collection('storeproducts');
    
    console.log('Adding sample products...');
    
    const sampleProducts = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        category: 'Electronics',
        subcategory: 'Audio',
        sku: 'WH-001',
        price: 150.00,
        cost: 100.00,
        stock: 50,
        minStock: 5,
        maxStock: 100,
        images: [],
        specifications: { color: 'Black', battery: '20 hours' },
        tags: ['wireless', 'audio', 'headphones'],
        status: 'active',
        featured: true,
        rating: 4.5,
        reviewCount: 25,
        supplier: 'Tech Supplier',
        supplierLocation: 'Lusaka',
        minOrderQuantity: 1,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Smartphone Case',
        description: 'Protective case for smartphones',
        category: 'Accessories',
        subcategory: 'Phone Cases',
        sku: 'PC-001',
        price: 25.00,
        cost: 15.00,
        stock: 100,
        minStock: 10,
        maxStock: 200,
        images: [],
        specifications: { material: 'Silicone', compatibility: 'Universal' },
        tags: ['phone', 'case', 'protection'],
        status: 'active',
        featured: false,
        rating: 4.2,
        reviewCount: 15,
        supplier: 'Accessory Supplier',
        supplierLocation: 'Ndola',
        minOrderQuantity: 1,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Laptop Stand',
        description: 'Adjustable laptop stand for better ergonomics',
        category: 'Office',
        subcategory: 'Desk Accessories',
        sku: 'LS-001',
        price: 75.00,
        cost: 45.00,
        stock: 30,
        minStock: 3,
        maxStock: 50,
        images: [],
        specifications: { material: 'Aluminum', adjustable: true },
        tags: ['laptop', 'stand', 'ergonomic'],
        status: 'active',
        featured: true,
        rating: 4.7,
        reviewCount: 8,
        supplier: 'Office Supplier',
        supplierLocation: 'Kitwe',
        minOrderQuantity: 1,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Clear existing products first
    await productsCollection.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert sample products
    const result = await productsCollection.insertMany(sampleProducts);
    console.log(`Inserted ${result.insertedCount} sample products`);
    
    // Verify insertion
    const count = await productsCollection.countDocuments();
    console.log(`Total products in database: ${count}`);
    
    await client.close();
    console.log('Sample products added successfully!');
  } catch (error) {
    console.error('Error adding sample products:', error);
  }
}

addSampleProducts();
