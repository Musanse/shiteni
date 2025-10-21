import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nodemailer = require('nodemailer');
    
    // Test SMTP connection directly
    const transporter = nodemailer.createTransport({
      host: 'server350.web-hosting.com',
      port: 587,
      secure: false,
      auth: {
        user: 'mankbvfr_musanse@server350.web-hosting.com',
        pass: '@M309877321k.'
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
      from: '"Mankuca Support" <mankbvfr_musanse@server350.web-hosting.com>',
      to: 'test@example.com',
      subject: 'SMTP Test - Mankuca',
      html: '<h1>SMTP Test</h1><p>This is a direct SMTP test.</p>',
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
