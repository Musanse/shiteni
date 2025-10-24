import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email service...');
    
    // Test email sending
    const testEmailTemplate = {
      subject: 'Test Email - Mankuca',
      html: '<h1>Test Email</h1><p>This is a test email from Mankuca.</p>',
      text: 'Test Email - This is a test email from Mankuca.'
    };
    const testEmailSent = await sendEmail('test@example.com', testEmailTemplate);

    return NextResponse.json({
      message: 'Email service test completed',
      emailSent: testEmailSent,
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpUser: process.env.SMTP_USER || 'Not configured',
      smtpHost: process.env.SMTP_HOST || 'server350.web-hosting.com',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS_SET: !!process.env.SMTP_PASS
      }
    });
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Email test failed',
        details: (error as Error).message,
        stack: (error as Error).stack,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          SMTP_HOST: process.env.SMTP_HOST,
          SMTP_PORT: process.env.SMTP_PORT,
          SMTP_USER: process.env.SMTP_USER,
          SMTP_PASS_SET: !!process.env.SMTP_PASS
        }
      },
      { status: 500 }
    );
  }
}
