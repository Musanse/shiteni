import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const nodemailer = require('nodemailer');
    
    // Test with a simple SMTP configuration that should work
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'theaterszm@gmail.com',
        pass: '@M309877321k.' // This needs to be replaced with Gmail App Password
      }
    });

    console.log('Testing Gmail SMTP with current password...');
    
    try {
      const result = await transporter.sendMail({
        from: '"Shiteni Support" <theaterszm@gmail.com>',
        to: to,
        subject: 'Email Test - Shiteni Platform',
        html: `
          <h1>Email Delivery Test</h1>
          <p>This is a test email from Shiteni Platform.</p>
          <p><strong>If you receive this email, the SMTP configuration is working!</strong></p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>From: theaterszm@gmail.com</p>
          <p>To: ${to}</p>
        `
      });
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        to: to,
        timestamp: new Date().toISOString()
      });
      
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
      
      // Provide helpful error message
      let errorMessage = emailError.message;
      if (emailError.message.includes('Invalid login')) {
        errorMessage = 'Gmail authentication failed. Please provide Gmail App Password.';
      } else if (emailError.message.includes('ENOTFOUND')) {
        errorMessage = 'SMTP server not found. Check internet connection.';
      }
      
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        details: errorMessage,
        suggestion: 'To fix this: 1) Enable 2FA on Gmail, 2) Generate App Password, 3) Update SMTP_PASS in .env.local'
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
