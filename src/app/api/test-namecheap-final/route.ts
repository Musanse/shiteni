import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const nodemailer = require('nodemailer');
    
    console.log('=== Testing Namecheap SMTP Configuration ===');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('Secure:', process.env.SMTP_SECURE);
    console.log('User:', process.env.SMTP_USER);
    console.log('Password Set:', !!process.env.SMTP_PASS);
    
    // Test with environment configuration
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logging
      logger: true
    });

    console.log('Testing SMTP connection...');
    
    // Test connection first
    let connectionResult = null;
    try {
      connectionResult = await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
      console.log('✅ SMTP Connection successful');
    } catch (connectionError) {
      console.log('❌ SMTP Connection failed:', connectionError.message);
      return NextResponse.json({
        success: false,
        error: 'SMTP Connection Failed',
        details: connectionError.message,
        code: connectionError.code,
        step: 'connection_test'
      });
    }

    // If connection successful, try sending email
    console.log('Attempting to send email...');
    
    const mailOptions = {
      from: '"Shiteni Support" <support@shiteni.com>',
      to: to,
      subject: 'Email Delivery Test - Shiteni Platform',
      html: `
        <h1>Email Delivery Test</h1>
        <p>This is a test email to verify email delivery from Shiteni Platform.</p>
        <p><strong>If you receive this email, the Namecheap SMTP configuration is working correctly!</strong></p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>From: support@shiteni.com</p>
        <p>To: ${to}</p>
        <p>Configuration: shiteni.com:465 (SSL)</p>
      `,
      text: `Email Delivery Test - This is a test email to verify email delivery from Shiteni Platform. If you receive this email, the Namecheap SMTP configuration is working correctly! Sent at: ${new Date().toISOString()}`
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Namecheap SMTP',
        messageId: result.messageId,
        to: to,
        from: 'support@shiteni.com',
        connectionTest: connectionResult,
        timestamp: new Date().toISOString(),
        step: 'email_sent',
        configuration: {
          host: 'shiteni.com',
          port: 465,
          secure: true,
          user: 'support@shiteni.com'
        }
      });
      
    } catch (emailError) {
      console.log('❌ Email sending failed:', emailError.message);
      return NextResponse.json({
        success: false,
        error: 'Email Sending Failed',
        details: emailError.message,
        code: emailError.code,
        connectionTest: connectionResult,
        step: 'email_sending',
        configuration: {
          host: 'shiteni.com',
          port: 465,
          secure: true,
          user: 'support@shiteni.com'
        }
      });
    }

  } catch (error) {
    console.error('Namecheap email test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Namecheap email test failed',
        message: error.message,
        step: 'general_error'
      },
      { status: 500 }
    );
  }
}
