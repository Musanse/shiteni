import { NextRequest, NextResponse } from 'next/server';
import { lipilaPaymentService } from '@/lib/lipila-payment';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Lipila API connection...');
    
    // Test the connection
    const connectionTest = await lipilaPaymentService.testConnection();
    
    // Test a minimal card payment request (without actually processing)
    const testPaymentData = {
      phoneNumber: '260971234567',
      amount: 100,
      email: 'test@example.com',
      clientRedirectUrl: 'https://example.com/callback',
      externalId: `TEST-${Date.now()}`,
      narration: 'Test payment'
    };

    console.log('Testing with sample payment data:', testPaymentData);

    return NextResponse.json({
      message: 'Lipila API test completed',
      timestamp: new Date().toISOString(),
      connectionTest,
      testPaymentData,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        LIPILA_SECRET_KEY_SET: !!process.env.LIPILA_SECRET_KEY,
        LIPILA_BASE_URL_SET: !!process.env.LIPILA_BASE_URL,
        LIPILA_CURRENCY_SET: !!process.env.LIPILA_CURRENCY
      }
    });
  } catch (error) {
    console.error('Lipila API test error:', error);
    return NextResponse.json(
      {
        error: 'Lipila API test failed',
        details: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, email, clientRedirectUrl } = body;

    console.log('Testing actual card payment with provided data:', body);

    if (!phoneNumber || !amount || !clientRedirectUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, clientRedirectUrl' },
        { status: 400 }
      );
    }

    const paymentData = {
      phoneNumber,
      amount: Number(amount),
      email: email || 'test@example.com',
      clientRedirectUrl,
      externalId: `TEST-${Date.now()}`,
      narration: 'Test payment'
    };

    const result = await lipilaPaymentService.processCardPayment(paymentData);

    return NextResponse.json({
      message: 'Test payment completed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      {
        error: 'Test payment failed',
        details: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
