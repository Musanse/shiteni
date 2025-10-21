import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail, emailTemplates } from '@/lib/email';

// Send order confirmation email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { customerEmail, customerName, orderDetails, type = 'order' } = await request.json();

    if (!customerEmail || !customerName || !orderDetails) {
      return NextResponse.json({ error: 'Customer email, name, and order details are required' }, { status: 400 });
    }

    let emailTemplate;
    let emailResult;

    switch (type) {
      case 'order':
        emailTemplate = emailTemplates.orderConfirmation(customerName, orderDetails);
        break;
      case 'promotion':
        emailTemplate = emailTemplates.promotion(customerName, orderDetails);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    emailResult = await sendEmail(customerEmail, emailTemplate);

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `${type} notification sent successfully`,
        messageId: emailResult.messageId
      });
    } else {
      return NextResponse.json({
        error: `Failed to send ${type} notification email`,
        details: emailResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send bulk notifications (for promotions, offers, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { recipients, notificationData, type = 'promotion' } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 });
    }

    if (!notificationData) {
      return NextResponse.json({ error: 'Notification data is required' }, { status: 400 });
    }

    // Verify the requester is an admin
    const requester = await User.findById(session.user.id);
    if (!requester || !['admin', 'super_admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const results = [];
    const errors = [];

    // Send emails to all recipients
    for (const recipient of recipients) {
      try {
        let emailTemplate;
        
        switch (type) {
          case 'promotion':
            emailTemplate = emailTemplates.promotion(recipient.name || 'Customer', notificationData);
            break;
          default:
            throw new Error('Invalid notification type');
        }

        const emailResult = await sendEmail(recipient.email, emailTemplate);
        
        if (emailResult.success) {
          results.push({
            email: recipient.email,
            success: true,
            messageId: emailResult.messageId
          });
        } else {
          errors.push({
            email: recipient.email,
            error: emailResult.error
          });
        }
      } catch (error) {
        errors.push({
          email: recipient.email,
          error: error
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${type} notifications processed`,
      results: {
        successful: results.length,
        failed: errors.length,
        details: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
