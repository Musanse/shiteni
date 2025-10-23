# Lipila Payment Gateway Setup Guide

## Current Issue
Your system is getting 401 Unauthorized errors because the Lipila API key is not properly configured for real payments.

## Steps to Enable Real Payments

### 1. Get Lipila API Credentials
- Visit: https://lipila.co.zm/
- Sign up for a merchant account
- Contact Lipila support to get your live API credentials
- You'll need:
  - `LIPILA_SECRET_KEY` (your live API key)
  - `LIPILA_BASE_URL` (production endpoint)
  - Merchant account verification

### 2. Update Environment Variables
Create a `.env.local` file in your project root with:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# JWT Configuration
JWT_SECRET=your-jwt-secret-change-this-in-production

# Application Configuration
NODE_ENV=development

# Lipila Payment Gateway Configuration - REAL PAYMENTS
LIPILA_SECRET_KEY=YOUR_REAL_LIPILA_API_KEY_HERE
LIPILA_BASE_URL=https://lipila-prod.hobbiton.app
LIPILA_CURRENCY=ZMW
LIPILA_MOCK_MODE=false
```

### 3. Replace Placeholder Values
- Replace `YOUR_REAL_LIPILA_API_KEY_HERE` with your actual Lipila API key
- Ensure `LIPILA_MOCK_MODE=false` for real payments
- Update other placeholder values as needed

### 4. Test the Configuration
After updating the environment variables:
1. Restart your development server
2. Try a card payment
3. Check the console logs for successful API calls
4. You should receive bank messages for card payments

## Current Status
- Mock mode is currently enabled (no real money charged)
- API key is using placeholder value
- System shows 401 Unauthorized errors

## Next Steps
1. Get your Lipila merchant account and API credentials
2. Update the `.env.local` file with real credentials
3. Set `LIPILA_MOCK_MODE=false`
4. Restart the server and test payments

## Support
- Lipila Documentation: https://lipila.io/docs/
- Contact Lipila support for API credential issues
- Check your merchant dashboard for transaction logs
