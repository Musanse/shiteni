import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates, verifyEmailConnection } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';
    
    console.log('🧪 Testing email configuration...');
    
    // Test SMTP connection
    console.log('Step 1: Verifying SMTP connection...');
    const connectionTest = await verifyEmailConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed. Check your SMTP configuration.',
        environment: {
          SMTP_HOST: process.env.SMTP_HOST,
          SMTP_PORT: process.env.SMTP_PORT,
          SMTP_SECURE: process.env.SMTP_SECURE,
          SMTP_USER: process.env.SMTP_USER,
          SMTP_PASS_SET: !!process.env.SMTP_PASS
        }
      }, { status: 500 });
    }
    
    console.log('✅ SMTP connection verified');
    
    // Test sending email
    console.log('Step 2: Sending test email...');
    const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=test123&email=${encodeURIComponent(testEmail)}`;
    const emailTemplate = emailTemplates.userVerification('Test User', testLink);
    
    const result = await sendEmail(testEmail, emailTemplate);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        email: testEmail,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          connected: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}

