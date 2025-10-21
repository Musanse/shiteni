// Simple Lipila configuration test
console.log('🔍 Lipila Payment Gateway Configuration Test');
console.log('==========================================');

// Check environment variables
const lipilaSecretKey = process.env.LIPILA_SECRET_KEY || 'LPLSECK-1e60018354064c8bb933b19044c22170';
const lipilaBaseUrl = process.env.LIPILA_BASE_URL || 'https://lipila-prod.hobbiton.app';
const lipilaMockMode = process.env.LIPILA_MOCK_MODE === 'true';

console.log('📊 Current Configuration:');
console.log('  Secret Key:', lipilaSecretKey.substring(0, 10) + '...');
console.log('  Base URL:', lipilaBaseUrl);
console.log('  Mock Mode:', lipilaMockMode);
console.log('');

// Check if using placeholder key
const isPlaceholderKey = lipilaSecretKey === 'LPLSECK-1e60018354064c8bb933b19044c22170' || 
                        lipilaSecretKey === 'your-lipila-secret-key-here';

if (isPlaceholderKey) {
  console.log('🚨 CRITICAL ISSUE: Using placeholder API key');
  console.log('💳 REAL PAYMENTS WILL FAIL with 401 Unauthorized');
  console.log('');
  console.log('🔧 TO FIX THIS:');
  console.log('1. Get your Lipila API credentials from: https://lipila.co.zm/');
  console.log('2. Create a .env.local file in your project root');
  console.log('3. Add your real API key:');
  console.log('   LIPILA_SECRET_KEY=your_real_api_key_here');
  console.log('   LIPILA_MOCK_MODE=false');
  console.log('4. Restart your development server');
  console.log('');
  console.log('📖 See LIPILA_SETUP_GUIDE.md for detailed instructions');
} else if (lipilaMockMode) {
  console.log('⚠️  Mock mode is enabled');
  console.log('💳 Payments will be fake - no real money charged');
  console.log('🔧 To enable real payments, set LIPILA_MOCK_MODE=false');
} else {
  console.log('✅ Configuration looks good for real payments');
  console.log('💳 Real payments should work (if API key is valid)');
}

console.log('');
console.log('🔗 Get Lipila credentials: https://lipila.co.zm/');
console.log('📖 Setup guide: LIPILA_SETUP_GUIDE.md');
