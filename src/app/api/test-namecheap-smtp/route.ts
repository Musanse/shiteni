import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nodemailer = require('nodemailer');
    
    // Test all possible Namecheap configurations
    const configs = [
      {
        name: 'mail.shiteni.com (Port 587)',
        config: {
          host: 'mail.shiteni.com',
          port: 587,
          secure: false,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'mail.shiteni.com (Port 465)',
        config: {
          host: 'mail.shiteni.com',
          port: 465,
          secure: true,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'mail.privateemail.com (Port 587)',
        config: {
          host: 'mail.privateemail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'mail.privateemail.com (Port 465)',
        config: {
          host: 'mail.privateemail.com',
          port: 465,
          secure: true,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'server350.web-hosting.com (Port 587)',
        config: {
          host: 'server350.web-hosting.com',
          port: 587,
          secure: false,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      }
    ];

    const results = [];

    for (const { name, config } of configs) {
      try {
        console.log(`\nTesting ${name}...`);
        const transporter = nodemailer.createTransporter(config);
        
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

        // If connection successful, try sending email
        let emailSent = false;
        let messageId = null;
        
        try {
          const testEmail = await transporter.sendMail({
            from: '"Shiteni Support" <support@shiteni.com>',
            to: 'kmusanse@gmail.com',
            subject: `Test Email - ${name}`,
            html: `<h1>Namecheap SMTP Test</h1><p>Configuration: ${name}</p><p>If you receive this email, this SMTP configuration works!</p>`
          });
          
          emailSent = !!testEmail.messageId;
          messageId = testEmail.messageId;
        } catch (emailError) {
          console.log(`Email sending failed for ${name}:`, emailError.message);
        }

        results.push({
          config: name,
          connectionTest: connectionTest,
          emailSent: emailSent,
          messageId: messageId,
          error: null
        });

        console.log(`${name}: Connection successful, Email sent: ${emailSent}`);

      } catch (error) {
        console.log(`${name}: Connection failed -`, error.message);
        results.push({
          config: name,
          connectionTest: false,
          emailSent: false,
          messageId: null,
          error: error.message,
          code: error.code
        });
      }
    }

    return NextResponse.json({
      message: 'Namecheap SMTP configuration test completed',
      results: results,
      recommendations: results.filter(r => r.connectionTest && r.emailSent),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Namecheap SMTP test error:', error);
    return NextResponse.json(
      { 
        error: 'Namecheap SMTP test failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
