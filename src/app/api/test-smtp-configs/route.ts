import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nodemailer = require('nodemailer');
    
    // Try different SMTP configurations for Namecheap
    const configs = [
      {
        name: 'Config 1: Standard Namecheap',
        config: {
          host: 'server350.web-hosting.com',
          port: 587,
          secure: false,
          auth: {
            user: 'mankbvfr_musanse@server350.web-hosting.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'Config 2: Alternative port',
        config: {
          host: 'server350.web-hosting.com',
          port: 465,
          secure: true,
          auth: {
            user: 'mankbvfr_musanse@server350.web-hosting.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'Config 3: Different host format',
        config: {
          host: 'mail.server350.web-hosting.com',
          port: 587,
          secure: false,
          auth: {
            user: 'mankbvfr_musanse@server350.web-hosting.com',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: 'Config 4: Username only',
        config: {
          host: 'server350.web-hosting.com',
          port: 587,
          secure: false,
          auth: {
            user: 'mankbvfr_musanse',
            pass: '@M309877321k.'
          },
          tls: { rejectUnauthorized: false }
        }
      }
    ];

    const results = [];

    for (const { name, config } of configs) {
      try {
        console.log(`Testing ${name}...`);
        const transporter = nodemailer.createTransport(config);
        
        const connectionTest = await new Promise((resolve, reject) => {
          transporter.verify((error, success) => {
            if (error) {
              reject(error);
            } else {
              resolve(success);
            }
          });
        });

        results.push({
          config: name,
          success: true,
          message: 'Connection successful'
        });

        // If connection successful, try sending email
        const testEmail = await transporter.sendMail({
          from: `"Mankuca Support" <${config.auth.user}>`,
          to: 'test@example.com',
          subject: `SMTP Test - ${name}`,
          html: `<h1>SMTP Test</h1><p>This is a test from ${name}</p>`,
        });

        results.push({
          config: name,
          success: true,
          message: 'Email sent successfully',
          messageId: testEmail.messageId
        });

        break; // Stop at first successful config

      } catch (error) {
        results.push({
          config: name,
          success: false,
          error: (error as Error).message,
          code: (error as any).code
        });
      }
    }

    return NextResponse.json({
      message: 'SMTP configuration test completed',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      { 
        error: 'SMTP test failed',
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}
