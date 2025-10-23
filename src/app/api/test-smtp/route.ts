import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nodemailer = require('nodemailer');
    
    // Test SMTP connection directly
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.shiteni.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'support@shiteni.com',
        pass: process.env.SMTP_PASS || '@M309877321k.'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Testing SMTP connection...');
    
    // Test connection
    const connectionTest = await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    console.log('SMTP connection test result:', connectionTest);

    // Try to send a test email
    const testEmail = await transporter.sendMail({
      from: `"Shiteni Support" <${process.env.SMTP_USER || 'support@shiteni.com'}>`,
      to: 'kmusanse@gmail.com',
      subject: 'SMTP Test - Shiteni Platform',
      html: '<h1>SMTP Test</h1><p>This is a direct SMTP test from Shiteni Platform.</p><p>If you receive this email, the SMTP configuration is working correctly!</p>',
    });

    return NextResponse.json({
      message: 'SMTP test completed',
      connectionTest: connectionTest,
      emailSent: !!testEmail.messageId,
      messageId: testEmail.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      { 
        error: 'SMTP test failed',
        message: (error as Error).message,
        code: (error as any).code,
        response: (error as any).response,
        command: (error as any).command,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}
