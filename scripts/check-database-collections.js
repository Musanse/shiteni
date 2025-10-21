const { MongoClient } = require('mongodb');

async function checkDatabaseCollections() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shiteni');
    await client.connect();
    
    const db = client.db('shiteni');
    
    console.log('Checking collections in database...');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== All Collections ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check specific collections
    const collectionsToCheck = ['storeorders', 'storecustomers', 'storeproducts'];
    
    for (const collectionName of collectionsToCheck) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`\n${collectionName}: ${count} documents`);
      
      if (count > 0) {
        const sample = await collection.findOne();
        console.log(`Sample document:`, JSON.stringify(sample, null, 2));
      }
    }
    
    await client.close();
    console.log('\nDatabase check completed!');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabaseCollections();
