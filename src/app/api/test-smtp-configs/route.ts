import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nodemailer = require('nodemailer');
    
    console.log('=== SMTP Configuration Debug ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS_SET:', !!process.env.SMTP_PASS);
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
    
    // Test different SMTP configurations
    const configs = [
      {
        name: 'Current Namecheap Config',
        config: {
          host: 'mail.shiteni.com',
          port: 587,
          secure: false,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Alternative Namecheap Config',
        config: {
          host: 'mail.shiteni.com',
          port: 465,
          secure: true,
          auth: {
            user: 'support@shiteni.com',
            pass: '@M309877321k.'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail SMTP (for testing)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'your-gmail@gmail.com',
            pass: 'your-app-password'
          }
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

        results.push({
          config: name,
          connectionTest: connectionTest,
          error: null
        });

        console.log(`${name}: Connection successful`);

      } catch (error) {
        console.log(`${name}: Connection failed -`, error.message);
        results.push({
          config: name,
          connectionTest: false,
          error: error.message,
          code: error.code
        });
      }
    }

    return NextResponse.json({
      message: 'SMTP configuration diagnostic completed',
      results: results,
      environment: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS_SET: !!process.env.SMTP_PASS,
        SMTP_SECURE: process.env.SMTP_SECURE
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMTP diagnostic error:', error);
    return NextResponse.json(
      { 
        error: 'SMTP diagnostic failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}