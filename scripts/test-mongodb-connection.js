const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Successfully connected to MongoDB!');
    
    // Get database info
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Test creating a simple document
    const testCollection = db.collection('connection_test');
    const testDoc = {
      message: 'Connection test successful',
      timestamp: new Date(),
      platform: 'Shiteni Multi-Vending Platform'
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log(`✅ Document inserted with ID: ${result.insertedId}`);
    
    // Test reading the document
    const retrievedDoc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Document retrieved successfully');
    console.log('   Message:', retrievedDoc.message);
    console.log('   Platform:', retrievedDoc.platform);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test document cleaned up');
    
    console.log('🎉 All tests passed! MongoDB connection is working perfectly.');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 This might be a network connectivity issue or incorrect connection string.');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('💡 This might be an authentication issue. Check your username and password.');
    } else if (error.name === 'MongoNetworkError') {
      console.error('💡 This might be a network issue. Check your internet connection.');
    }
    
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testConnection();