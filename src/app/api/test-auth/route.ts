import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const nodemailer = require('nodemailer');
    
    console.log('=== Testing Email Authentication ===');
    console.log('Current config:');
    console.log('- Host: mail.privateemail.com');
    console.log('- Port: 587');
    console.log('- User: support@shiteni.com');
    console.log('- Pass: a03kHedS-LFT');
    
    // Test with current configuration
    const transporter = nodemailer.createTransporter({
      host: 'mail.privateemail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'support@shiteni.com',
        pass: 'a03kHedS-LFT'
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });

    console.log('Testing authentication...');
    
    try {
      // Test connection and authentication
      const connectionResult = await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
      
      console.log('✅ Authentication successful!');
      
      // If auth succeeds, try sending email
      const result = await transporter.sendMail({
        from: '"Shiteni Support" <support@shiteni.com>',
        to: to,
        subject: 'Authentication Test - Shiteni Platform',
        html: `
          <h1>Authentication Test Successful!</h1>
          <p>This email confirms that the SMTP authentication is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>From: support@shiteni.com</p>
          <p>To: ${to}</p>
        `
      });
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully - Authentication working!',
        messageId: result.messageId,
        to: to,
        timestamp: new Date().toISOString()
      });
      
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.message);
      
      // Provide specific error information
      let errorType = 'Unknown';
      let suggestion = 'Check your email credentials';
      
      if (authError.code === 'EAUTH') {
        errorType = 'Authentication Failed';
        suggestion = 'Please verify: 1) Email account exists, 2) Password is correct, 3) Account is activated';
      } else if (authError.code === 'ECONNECTION') {
        errorType = 'Connection Failed';
        suggestion = 'Check SMTP host and port settings';
      } else if (authError.code === 'ETIMEDOUT') {
        errorType = 'Connection Timeout';
        suggestion = 'Check network connection and firewall settings';
      }
      
      return NextResponse.json({
        success: false,
        error: errorType,
        details: authError.message,
        code: authError.code,
        suggestion: suggestion,
        currentConfig: {
          host: 'mail.privateemail.com',
          port: 587,
          user: 'support@shiteni.com',
          passSet: !!'a03kHedS-LFT'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Email test failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
