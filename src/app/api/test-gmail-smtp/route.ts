import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();
    
    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, message' }, { status: 400 });
    }

    const nodemailer = require('nodemailer');
    
    // Try Gmail SMTP as a fallback (you'll need to set up App Password)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'kmusanse@gmail.com', // Your Gmail address
        pass: 'your-app-password'   // You need to generate an App Password
      }
    });

    console.log('Sending email via Gmail SMTP...');
    
    const mailOptions = {
      from: 'kmusanse@gmail.com',
      to: to,
      subject: subject,
      html: `<h1>Test Email from Shiteni</h1><p>${message}</p><p>This email was sent via Gmail SMTP as a fallback.</p>`
    };

    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully via Gmail SMTP',
      messageId: result.messageId,
      to: to,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gmail SMTP error:', error);
    return NextResponse.json(
      { 
        error: 'Gmail SMTP failed',
        message: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
