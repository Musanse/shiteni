const { lipilaPaymentService } = require('../src/lib/lipila-payment.ts');

async function testLipilaConnection() {
  console.log('🔍 Testing Lipila Payment Gateway Connection...');
  console.log('=====================================');
  
  try {
    const result = await lipilaPaymentService.testConnection();
    
    if (result.success) {
      console.log('✅ SUCCESS:', result.message);
      console.log('📊 Details:', JSON.stringify(result.details, null, 2));
      console.log('');
      console.log('🎉 Your Lipila configuration is working!');
      console.log('💳 You can now process real payments.');
    } else {
      console.log('❌ FAILED:', result.message);
      console.log('📊 Details:', JSON.stringify(result.details, null, 2));
      console.log('');
      console.log('🚨 Your Lipila configuration needs to be fixed.');
      console.log('📖 See LIPILA_SETUP_GUIDE.md for setup instructions.');
    }
  } catch (error) {
    console.error('💥 ERROR testing Lipila connection:', error.message);
    console.log('');
    console.log('🚨 There was an error testing the connection.');
    console.log('📖 See LIPILA_SETUP_GUIDE.md for setup instructions.');
  }
  
  console.log('=====================================');
  console.log('🔗 Get Lipila credentials: https://lipila.co.zm/');
  console.log('📖 Setup guide: LIPILA_SETUP_GUIDE.md');
}

testLipilaConnection();
