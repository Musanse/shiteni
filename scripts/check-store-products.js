const { MongoClient } = require('mongodb');

async function checkStoreProducts() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    await client.connect();
    
    const db = client.db('shiteni');
    const productsCollection = db.collection('storeproducts');
    
    console.log('Checking store products...');
    const products = await productsCollection.find({}).toArray();
    
    console.log(`Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - Status: ${product.status} - Price: ${product.price}`);
    });
    
    const activeProducts = await productsCollection.find({ status: 'active' }).toArray();
    console.log(`\nActive products: ${activeProducts.length}`);
    
    await client.close();
  } catch (error) {
    console.error('Error checking products:', error);
  }
}

checkStoreProducts();
