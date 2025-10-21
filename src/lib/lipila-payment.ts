import axios from 'axios';

// Lipila API Configuration
const LIPILA_CONFIG = {
  secretKey: process.env.LIPILA_SECRET_KEY || 'LPLSECK-1e60018354064c8bb933b19044c22170',
  baseUrl: process.env.LIPILA_BASE_URL || 'https://lipila-prod.hobbiton.app',
  currency: process.env.LIPILA_CURRENCY || 'ZMW',
  mockMode: process.env.LIPILA_MOCK_MODE === 'true'
};

// Validate Lipila configuration
const validateLipilaConfig = () => {
  const issues = [];
  
  if (!LIPILA_CONFIG.secretKey || LIPILA_CONFIG.secretKey === 'your-lipila-secret-key-here' || LIPILA_CONFIG.secretKey === 'LPLSECK-1e60018354064c8bb933b19044c22170') {
    issues.push('LIPILA_SECRET_KEY is using placeholder/default value - REAL PAYMENTS WILL FAIL');
  }
  
  if (!LIPILA_CONFIG.baseUrl) {
    issues.push('LIPILA_BASE_URL is not properly configured');
  }
  
  if (issues.length > 0) {
    console.error('🚨 CRITICAL: Lipila Configuration Issues:', issues);
    console.error('💳 REAL PAYMENTS ARE DISABLED - You need valid Lipila API credentials');
    console.error('📖 See LIPILA_SETUP_GUIDE.md for setup instructions');
    console.error('🔗 Get credentials from: https://lipila.co.zm/');
    console.error('⚠️  Current API key appears to be placeholder - payments will fail with 401 Unauthorized');
  } else {
    console.log('✅ Lipila configuration appears valid for real payments');
  }
  
  return issues.length === 0;
};

// Payment types supported by Lipila
export type PaymentType = 'mobile-money' | 'card';
export type PaymentStatus = 'Pending' | 'Successful' | 'Failed' | 'Cancelled';

// Customer information interface
export interface CustomerInfo {
  fullName?: string;
  phoneNumber: string;
  email?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerCity?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerZip?: number;
}

// Payment request interface
export interface PaymentRequest {
  currency: string;
  amount: number;
  accountNumber: string;
  phoneNumber: string;
  email?: string;
  fullName?: string;
  externalId?: string;
  narration?: string;
  clientRedirectUrl?: string;
  customer?: CustomerInfo;
}

// Payment response interface
export interface PaymentResponse {
  status: PaymentStatus;
  message: string;
  transactionId: string;
  externalId?: string;
  amount: number;
  currency?: string;
  paymentType?: string;
  redirectUrl?: string;
  clientRedirectUrl?: string;
}

// Transaction status response interface
export interface TransactionStatusResponse {
  status: PaymentStatus;
  paymentType: string;
  currency: string;
  amount: number;
  accountNumber: string;
  customer: {
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  ipAddress: string;
  message: string;
  transactionId: string;
  externalId: string;
}

class LipilaPaymentService {
  private baseUrl: string;
  private secretKey: string;
  private mockMode: boolean;

  constructor() {
    this.baseUrl = LIPILA_CONFIG.baseUrl;
    this.secretKey = LIPILA_CONFIG.secretKey;
    this.mockMode = LIPILA_CONFIG.mockMode;
    
    // Validate configuration on initialization
    validateLipilaConfig();
    
    console.log('🔧 Lipila Payment Service initialized:', {
      baseUrl: this.baseUrl,
      secretKeyPrefix: this.secretKey.substring(0, 10) + '...',
      mockMode: this.mockMode,
      currency: LIPILA_CONFIG.currency
    });

    // Check if using placeholder API key
    const isPlaceholderKey = this.secretKey === 'LPLSECK-1e60018354064c8bb933b19044c22170' || 
                            this.secretKey === 'your-lipila-secret-key-here';

    if (isPlaceholderKey) {
      console.error('🚨 CRITICAL ERROR: Using placeholder Lipila API key');
      console.error('💳 REAL PAYMENTS WILL FAIL - You need valid Lipila credentials');
      console.error('📖 Setup instructions: See LIPILA_SETUP_GUIDE.md');
      console.error('🔗 Get API credentials from: https://lipila.co.zm/');
      console.error('⚠️  Current key: ' + this.secretKey.substring(0, 10) + '... (PLACEHOLDER)');
    } else if (this.mockMode) {
      console.warn('⚠️  WARNING: LIPILA_MOCK_MODE is ENABLED');
      console.warn('💳 All payments will be DUMMY/FAKE - no real money will be charged');
      console.warn('🔧 To enable real payments, set LIPILA_MOCK_MODE=false in .env.local');
    } else {
      console.log('✅ Real payment mode enabled - payments will be processed through Lipila');
    }
  }

  /**
   * Test Lipila API connection with multiple authentication methods
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      console.log('🔍 Testing Lipila API connection...');
      console.log('Configuration:', {
        baseUrl: this.baseUrl,
        secretKeyPrefix: this.secretKey.substring(0, 10) + '...',
        mockMode: this.mockMode
      });
      
      // If in mock mode, return success without making actual API call
      if (this.mockMode) {
        console.log('✅ Mock mode enabled - skipping actual API test');
        return {
          success: true,
          message: 'Mock mode enabled - API test skipped',
          details: { mockMode: true }
        };
      }
      
      // Try different authentication methods
      const authMethods = [
        { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${this.secretKey}` } },
        { name: 'API Key Header', headers: { 'X-API-Key': this.secretKey } },
        { name: 'Authorization Header', headers: { 'Authorization': this.secretKey } },
        { name: 'Custom Header', headers: { 'X-Lipila-Key': this.secretKey } }
      ];

      let lastError = null;
      
      for (const method of authMethods) {
        try {
          console.log(`Trying ${method.name} authentication...`);
          
          const response = await axios.get(`${this.baseUrl}/health`, {
            headers: {
              ...method.headers,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });

          console.log(`✅ ${method.name} authentication successful`);
          return {
            success: true,
            message: `Lipila API connection successful using ${method.name}`,
            details: {
              authMethod: method.name,
              response: response.data,
              status: response.status
            }
          };
        } catch (error: unknown) {
          lastError = error;
          if (axios.isAxiosError(error)) {
            console.log(`❌ ${method.name} failed:`, error.response?.status, error.response?.statusText);
          } else {
            console.log(`❌ ${method.name} failed:`, error);
          }
        }
      }

      // If all methods failed, return the last error
      console.error('❌ All authentication methods failed');
      const errorDetails = lastError && axios.isAxiosError(lastError) ? {
        status: lastError.response?.status,
        statusText: lastError.response?.statusText,
        data: lastError.response?.data,
        url: lastError.config?.url
      } : null;
      
      return {
        success: false,
        message: `All authentication methods failed. Last error: ${errorDetails?.status} ${errorDetails?.statusText}`,
        details: {
          lastError: errorDetails,
          triedMethods: authMethods.map(m => m.name)
        }
      };
      
    } catch (error: unknown) {
      console.error('❌ Lipila API connection test failed:', error);
      
      return {
        success: false,
        message: `Lipila API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error,
          baseUrl: this.baseUrl,
          secretKeyConfigured: !!this.secretKey && this.secretKey !== 'your-lipila-secret-key-here'
        }
      };
    }
  }

  /**
   * Process mobile money payment
   */
  async processMobileMoneyPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('=== Starting Mobile Money Payment Process ===');
      console.log('Payment data received:', {
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        email: paymentData.email,
        externalId: paymentData.externalId
      });

      // Check if we're in mock mode
      if (this.mockMode) {
        console.log('Using mock payment mode for development');
        return this.getMockPaymentResponse(paymentData);
      }

      // Validate required fields
      if (!paymentData.phoneNumber || !paymentData.amount) {
        throw new Error('Phone number and amount are required');
      }

      // Format phone number (ensure it starts with country code)
      let phoneNumber = paymentData.phoneNumber;
      if (!phoneNumber.startsWith('260')) {
        phoneNumber = phoneNumber.startsWith('0') ? '260' + phoneNumber.substring(1) : '260' + phoneNumber;
      }

      // Validate amount is a positive number
      const amount = Number(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount. Amount must be a positive number');
      }

      // Validate phone number format
      if (!/^260[0-9]{9}$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format. Must be a valid Zambian number (e.g., 260XXXXXXXXX)');
      }

      const requestBody = {
        currency: paymentData.currency || LIPILA_CONFIG.currency,
        amount: amount,
        accountNumber: phoneNumber, // For mobile money, accountNumber is usually the phone number
        phoneNumber: phoneNumber,
        fullName: paymentData.fullName || 'Customer',
        email: paymentData.email || '',
        externalId: paymentData.externalId || `MM-${Date.now()}`,
        narration: paymentData.narration || 'Mobile money payment'
      };

      console.log('Mobile money payment request body:', requestBody);
      console.log('Making API request to:', `${this.baseUrl}/transactions/mobile-money`);
      console.log('Request headers:', {
        'Authorization': `Bearer ${this.secretKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      // Try different authentication methods for mobile money with retry logic
      const authMethods = [
        { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${this.secretKey}` } },
        { name: 'API Key Header', headers: { 'X-API-Key': this.secretKey } },
        { name: 'Authorization Header', headers: { 'Authorization': this.secretKey } },
        { name: 'Custom Header', headers: { 'X-Lipila-Key': this.secretKey } }
      ];

      let lastError = null;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      const timeoutMs = 45000; // Increased to 45 seconds for mobile money
      
      for (const method of authMethods) {
        let retryCount = 0;
        let methodSuccess = false;
        
        while (retryCount < maxRetries && !methodSuccess) {
          try {
            if (retryCount > 0) {
              console.log(`🔄 Retrying mobile money payment with ${method.name} (attempt ${retryCount + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            } else {
              console.log(`Trying mobile money payment with ${method.name}...`);
            }
            
            const response = await axios.post(
              `${this.baseUrl}/transactions/mobile-money`,
              requestBody,
              {
                headers: {
                  ...method.headers,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                timeout: timeoutMs // Increased timeout for mobile money
              }
            );

            console.log(`✅ Mobile money payment successful with ${method.name}`);
            console.log('Mobile money payment response:', response.data);
            methodSuccess = true;
            return response.data;
          } catch (error: unknown) {
            lastError = error;
            if (axios.isAxiosError(error)) {
              const status = error.response?.status;
              const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
              
              if (isTimeout) {
                console.log(`⏰ ${method.name} timed out after ${timeoutMs}ms`);
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`🔄 Will retry in ${retryDelay * retryCount}ms due to timeout...`);
                  continue;
                } else {
                  console.error(`❌ Max retries (${maxRetries}) reached for ${method.name} due to timeout`);
                }
              } else {
                console.log(`❌ ${method.name} failed:`, status, error.response?.statusText);
                
                // Retry for 502, 503, 504 errors
                if (status === 502 || status === 503 || status === 504) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(`🔄 Will retry in ${retryDelay * retryCount}ms due to ${status} error...`);
                    continue;
                  } else {
                    console.error(`❌ Max retries (${maxRetries}) reached for ${method.name} with ${status} error`);
                  }
                }
                
                // If this is not a 401 error, don't try other methods
                if (status !== 401) {
                  break;
                }
              }
            } else {
              console.log(`❌ ${method.name} failed:`, error);
              break;
            }
          }
        }
        
        // If this method succeeded, break out of the auth methods loop
        if (methodSuccess) {
          break;
        }
      }

      // If all authentication methods failed, throw the last error
      throw lastError || new Error('All authentication methods failed');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Mobile money payment API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data
          }
        });
        
        // Handle specific error cases
        const status = error.response?.status;
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        
        if (isTimeout) {
          console.error('⏰ Timeout Error: Mobile money payment request timed out');
          console.error('💡 This might be due to:');
          console.error('   - Slow API response from Lipila');
          console.error('   - Network connectivity issues');
          console.error('   - High server load');
          console.error('   - Mobile money provider delays');
          throw new Error('Mobile money payment failed: Request timeout - Please try again or check your network connection');
        } else if (status === 401) {
          console.error('🔐 Authentication Error: Invalid or expired Lipila API credentials');
          console.error('💡 Please check your LIPILA_SECRET_KEY in .env.local');
          throw new Error('Mobile money payment failed: Unauthorized - Please check your Lipila API credentials');
        } else if (status === 403) {
          console.error('🚫 Authorization Error: Insufficient permissions for this API key');
          throw new Error('Mobile money payment failed: Forbidden - API key lacks required permissions');
        } else if (status === 400) {
          console.error('📝 Bad Request Error: Invalid payment data');
          throw new Error(`Mobile money payment failed: ${error.response?.data?.message || 'Invalid payment data'}`);
        } else if (status === 502) {
          console.error('🌐 Bad Gateway Error: Lipila API server issue');
          console.error('💡 This usually means:');
          console.error('   - Lipila API server is temporarily down');
          console.error('   - Network connectivity issues');
          console.error('   - API server overloaded');
          throw new Error('Mobile money payment failed: Server temporarily unavailable (502 Bad Gateway) - Please try again in a few minutes');
        } else if (status === 503) {
          console.error('🔧 Service Unavailable: Lipila API temporarily down');
          throw new Error('Mobile money payment failed: Service temporarily unavailable. Please try again later.');
        } else if (status === 504) {
          console.error('⏰ Gateway Timeout: Request took too long');
          console.error('💡 This might be due to:');
          console.error('   - Slow API response');
          console.error('   - Network latency');
          console.error('   - Server processing delays');
          throw new Error('Mobile money payment failed: Request timeout (504 Gateway Timeout) - Please try again');
        } else if (status && status >= 500) {
          console.error('🔧 Server Error: Lipila API server issue');
          throw new Error('Mobile money payment failed: Server error - Please try again later');
        }
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown API error';
        throw new Error(`Mobile money payment failed: ${errorMessage}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Mobile money payment error:', error);
        throw new Error(`Mobile money payment failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Process card payment
   */
  async processCardPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('=== Starting Card Payment Process ===');
      console.log('Payment data received:', {
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        email: paymentData.email,
        clientRedirectUrl: paymentData.clientRedirectUrl,
        externalId: paymentData.externalId
      });

      // Check if we're in development mode and should use mock responses
      if (this.mockMode) {
        console.log('Using mock payment mode for development');
        return this.getMockPaymentResponse(paymentData);
      }

      // Validate required fields
      if (!paymentData.phoneNumber || !paymentData.amount || !paymentData.clientRedirectUrl) {
        throw new Error('Phone number, amount, and redirect URL are required for card payments');
      }

      // Format phone number (ensure it starts with country code)
      let phoneNumber = paymentData.phoneNumber;
      if (!phoneNumber.startsWith('260')) {
        phoneNumber = phoneNumber.startsWith('0') ? '260' + phoneNumber.substring(1) : '260' + phoneNumber;
      }

      // Validate amount is a positive number
      const amount = Number(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount. Amount must be a positive number');
      }

      // Validate phone number format
      if (!/^260[0-9]{9}$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format. Must be a valid Zambian number (e.g., 260XXXXXXXXX)');
      }

      const requestBody = {
        currency: paymentData.currency || LIPILA_CONFIG.currency,
        amount: amount,
        phoneNumber: phoneNumber,
        email: paymentData.email || '',
        customerFirstName: paymentData.customer?.customerFirstName || paymentData.fullName?.split(' ')[0] || 'Customer',
        customerLastName: paymentData.customer?.customerLastName || paymentData.fullName?.split(' ').slice(1).join(' ') || 'User',
        customerCity: paymentData.customer?.customerCity || 'Lusaka',
        customerCountry: paymentData.customer?.customerCountry || 'Zambia',
        customerAddress: paymentData.customer?.customerAddress || '123 Main Street',
        customerZip: paymentData.customer?.customerZip || 10101,
        externalId: paymentData.externalId || `CARD-${Date.now()}`,
        narration: paymentData.narration || 'Card payment',
        clientRedirectUrl: paymentData.clientRedirectUrl
      };

      console.log('Payment request body:', requestBody);
      console.log('Payment data validation:', {
        phoneNumberValid: /^260[0-9]{9}$/.test(phoneNumber),
        amountValid: !isNaN(amount) && amount > 0,
        redirectUrlValid: !!paymentData.clientRedirectUrl,
        emailValid: paymentData.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email) : true
      });

      console.log('Making API request to:', `${this.baseUrl}/transactions/card`);
      console.log('Request headers:', {
        'Authorization': `Bearer ${this.secretKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      // Try different authentication methods for card payment with retry logic
      const authMethods = [
        { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${this.secretKey}` } },
        { name: 'API Key Header', headers: { 'X-API-Key': this.secretKey } },
        { name: 'Authorization Header', headers: { 'Authorization': this.secretKey } },
        { name: 'Custom Header', headers: { 'X-Lipila-Key': this.secretKey } }
      ];

      let lastError = null;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      
      for (const method of authMethods) {
        let retryCount = 0;
        let methodSuccess = false;
        
        while (retryCount < maxRetries && !methodSuccess) {
          try {
            if (retryCount > 0) {
              console.log(`🔄 Retrying card payment with ${method.name} (attempt ${retryCount + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            } else {
              console.log(`Trying card payment with ${method.name}...`);
            }
            
            const response = await axios.post(
              `${this.baseUrl}/transactions/card`,
              requestBody,
              {
                headers: {
                  ...method.headers,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                timeout: 30000 // 30 second timeout
              }
            );

            console.log(`✅ Card payment successful with ${method.name}`);
            console.log('Card payment response received:', {
              status: response.status,
              statusText: response.statusText,
              data: response.data
            });
            
            // Check if the response indicates success
            if (response.data && response.data.status === 'Successful') {
              console.log('Payment successful:', response.data);
              methodSuccess = true;
              return response.data;
            } else if (response.data && response.data.status === 'Failed') {
              const errorMessage = response.data.message || 'Payment processing failed';
              console.error('Payment failed with status:', response.data);
              throw new Error(`Card payment failed: ${errorMessage}`);
            }
            
            console.log('Payment response (non-failed):', response.data);
            methodSuccess = true;
            return response.data;
          } catch (error: unknown) {
            lastError = error;
            if (axios.isAxiosError(error)) {
              const status = error.response?.status;
              console.log(`❌ ${method.name} failed:`, status, error.response?.statusText);
              
              // Retry for 502, 503, 504 errors
              if (status === 502 || status === 503 || status === 504) {
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`🔄 Will retry in ${retryDelay * retryCount}ms due to ${status} error...`);
                  continue;
                } else {
                  console.error(`❌ Max retries (${maxRetries}) reached for ${method.name} with ${status} error`);
                }
              }
              
              // If this is not a 401 error, don't try other methods
              if (status !== 401) {
                break;
              }
            } else {
              console.log(`❌ ${method.name} failed:`, error);
              break;
            }
          }
        }
        
        // If this method succeeded, break out of the auth methods loop
        if (methodSuccess) {
          break;
        }
      }

      // If all authentication methods failed, throw the last error
      throw lastError || new Error('All authentication methods failed');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Card payment API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data
          }
        });
        
        // Handle specific error cases
        const status = error.response?.status;
        if (status === 401) {
          console.error('🔐 Authentication Error: Invalid or expired Lipila API credentials');
          console.error('💡 Please check your LIPILA_SECRET_KEY in .env.local');
          throw new Error('Card payment failed: Unauthorized - Please check your Lipila API credentials');
        } else if (status === 403) {
          console.error('🚫 Authorization Error: Insufficient permissions for this API key');
          throw new Error('Card payment failed: Forbidden - API key lacks required permissions');
        } else if (status === 400) {
          console.error('📝 Bad Request Error: Invalid payment data');
          const errorMessage = error.response?.data?.message || 'Invalid payment request';
          if (errorMessage.includes('token') || errorMessage.includes('Token')) {
            console.error('🔑 Token generation issue detected');
            console.error('💡 This might be due to:');
            console.error('   - Missing required fields for token generation');
            console.error('   - Invalid customer data format');
            console.error('   - API endpoint not supporting card payments');
            console.error('   - Card payment service not enabled');
            throw new Error(`Card payment failed: Token generation failed - ${errorMessage}`);
          }
          throw new Error(`Card payment failed: ${errorMessage}`);
        } else if (status === 404) {
          console.error('🔍 Endpoint Not Found: Card payment endpoint may not exist');
          console.error('💡 Please check:');
          console.error('   - API documentation for correct endpoint');
          console.error('   - If card payments are supported by your API key');
          console.error('   - Contact Lipila support for card payment details');
          throw new Error('Card payment failed: Endpoint not found - Card payment may not be supported');
        } else if (status === 500) {
          console.error('🔧 Server Error: Lipila API server issue');
          throw new Error('Card payment failed: Server error. Please try again later or contact support.');
        } else if (status === 502) {
          console.error('🌐 Bad Gateway Error: Lipila API server issue');
          console.error('💡 This usually means:');
          console.error('   - Lipila API server is temporarily down');
          console.error('   - Network connectivity issues');
          console.error('   - API server overloaded');
          console.error('   - Proxy/gateway configuration issue');
          throw new Error('Card payment failed: Server temporarily unavailable (502 Bad Gateway) - Please try again in a few minutes');
        } else if (status === 503) {
          console.error('🔧 Service Unavailable: Lipila API temporarily down');
          throw new Error('Card payment failed: Service temporarily unavailable. Please try again later.');
        } else if (status === 504) {
          console.error('⏰ Gateway Timeout: Request took too long');
          console.error('💡 This might be due to:');
          console.error('   - Slow API response');
          console.error('   - Network latency');
          console.error('   - Server processing delays');
          throw new Error('Card payment failed: Request timeout (504 Gateway Timeout) - Please try again');
        }
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown API error';
        throw new Error(`Card payment failed: ${errorMessage}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Card payment error:', error);
        throw new Error(`Card payment failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Get mock payment response for development/testing
   */
  private getMockPaymentResponse(paymentData: PaymentRequest): PaymentResponse {
    console.warn('🎭 MOCK PAYMENT: Returning fake successful response');
    console.warn('💳 NO REAL MONEY WAS CHARGED - This is a dummy payment');
    console.warn('🔧 To enable real payments, set LIPILA_MOCK_MODE=false');
    
    const mockResponse: PaymentResponse = {
      status: 'Successful',
      message: 'Mock payment successful - NO REAL MONEY CHARGED',
      transactionId: `MOCK-${Date.now()}`,
      externalId: paymentData.externalId || `MOCK-${Date.now()}`,
      redirectUrl: paymentData.clientRedirectUrl,
      amount: Number(paymentData.amount),
      currency: paymentData.currency || LIPILA_CONFIG.currency,
      paymentType: 'mock',
      clientRedirectUrl: paymentData.clientRedirectUrl
    };

    console.log('Returning mock payment response:', mockResponse);
    return mockResponse;
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(transactionId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Cancelling transaction:', transactionId);

      const response = await axios.post(
        `${this.baseUrl}/transactions/cancel`,
        { transactionId },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('Transaction cancellation response:', response.data);
      return {
        success: true,
        message: response.data.message || 'Transaction cancelled successfully'
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Transaction cancellation error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        return {
          success: false,
          message: `Failed to cancel transaction: ${errorMessage}`
        };
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Transaction cancellation error:', error);
        return {
          success: false,
          message: `Failed to cancel transaction: ${errorMessage}`
        };
      }
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
    try {
      console.log('Checking transaction status:', {
        url: `${this.baseUrl}/transactions/status?transactionId=${transactionId}`,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Accept': 'application/json'
        }
      });

      // If in mock mode, return mock status
      if (this.mockMode) {
        console.log('🎭 MOCK MODE: Returning mock transaction status');
        const mockStatus: TransactionStatusResponse = {
          status: 'Successful',
          paymentType: 'mock',
          currency: LIPILA_CONFIG.currency,
          amount: 0,
          accountNumber: '260000000000',
          customer: {
            fullName: 'Mock Customer',
            phoneNumber: '260000000000',
            email: 'mock@example.com'
          },
          ipAddress: '127.0.0.1',
          message: 'Mock transaction successful - NO REAL MONEY CHARGED',
          transactionId: transactionId,
          externalId: transactionId
        };
        console.log('Returning mock transaction status:', mockStatus);
        return mockStatus;
      }

      const response = await axios.get(
        `${this.baseUrl}/transactions/status?transactionId=${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('Transaction status response:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Transaction status API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method
          }
        });
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown API error';
        throw new Error(`Failed to get transaction status: ${errorMessage}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Transaction status error:', error);
        throw new Error(`Failed to get transaction status: ${errorMessage}`);
      }
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(
    subscriptionId: string,
    amount: number,
    paymentType: PaymentType,
    customerInfo: CustomerInfo,
    narration?: string
  ): Promise<PaymentResponse> {
    const externalId = `SUB-${subscriptionId}-${Date.now()}`;
    
    const paymentData: PaymentRequest = {
      currency: LIPILA_CONFIG.currency,
      amount: amount,
      accountNumber: customerInfo.phoneNumber,
      phoneNumber: customerInfo.phoneNumber,
      email: customerInfo.email,
      fullName: customerInfo.fullName,
      externalId: externalId,
      narration: narration || `Subscription payment - ${externalId}`,
      customer: customerInfo,
      // Add redirect URL for card payments
      clientRedirectUrl: paymentType === 'card' 
        ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/vendor/pharmacy/subscription?payment=success&transactionId=${externalId}`
        : undefined
    };

    // Handle payment type variations (mobile_money vs mobile-money)
    const normalizedPaymentType = paymentType === 'mobile_money' ? 'mobile-money' : paymentType;
    
    if (normalizedPaymentType === 'mobile-money') {
      return await this.processMobileMoneyPayment(paymentData);
    } else {
      return await this.processCardPayment(paymentData);
    }
  }

  /**
   * Verify payment completion
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const status = await this.getTransactionStatus(transactionId);
      return status.status === 'Successful';
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const lipilaPaymentService = new LipilaPaymentService();
export default lipilaPaymentService;
