import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();
    
    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, message' }, { status: 400 });
    }

    // Using SendGrid API (you'll need to get API key from sendgrid.com)
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key';
    
    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: {
        email: 'support@shiteni.com',
        name: 'Shiteni Support'
      },
      content: [
        {
          type: 'text/html',
          value: `
            <h1>${subject}</h1>
            <p>${message}</p>
            <p>This email was sent from Shiteni Platform.</p>
            <p>Sent at: ${new Date().toISOString()}</p>
          `
        }
      ]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via SendGrid',
        to: to,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: 'SendGrid API error',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }

  } catch (error) {
    console.error('SendGrid email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'SendGrid email failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
