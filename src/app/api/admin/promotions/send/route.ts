import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, recipientType, vendorType, vendorId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    await connectDB();

    let recipients: Array<{ email: string; name: string }> = [];

    // Get recipients based on selection
    if (recipientType === 'all') {
      const users = await (User as any).find({}).select('email firstName lastName').lean();
      recipients = users.map((user: any) => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }));
    } else if (recipientType === 'customers') {
      const users = await (User as any).find({ role: 'customer' }).select('email firstName lastName').lean();
      recipients = users.map((user: any) => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }));
    } else if (recipientType === 'all_vendors') {
      const users = await (User as any).find({
        role: { $in: ['manager', 'admin'] },
        serviceType: { $exists: true }
      }).select('email firstName lastName').lean();
      recipients = users.map((user: any) => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }));
    } else if (recipientType === 'specific_vendor_type') {
      const users = await (User as any).find({
        role: { $in: ['manager', 'admin'] },
        serviceType: vendorType
      }).select('email firstName lastName').lean();
      recipients = users.map((user: any) => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }));
    } else if (recipientType === 'specific_vendor') {
      const vendor = await (User as any).findById(vendorId);
      if (vendor && vendor.businessId) {
        const users = await (User as any).find({
          businessId: vendor.businessId
        }).select('email firstName lastName').lean();
        recipients = users.map((user: any) => ({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        }));
      }
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const emailTemplate = {
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #2d5f3f, #4a7c59); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .message { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 ${subject}</h1>
                </div>
                <div class="content">
                  <h2>Hello ${recipient.name},</h2>
                  <div class="message">${message}</div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Shiteni. All rights reserved.</p>
                  <p>This email was sent from support@shiteni.com</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: message
        };

        await sendEmail(recipient.email, emailTemplate);
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${successCount} recipients${failCount > 0 ? ` (${failCount} failed)` : ''}`,
      successCount,
      failCount,
      totalRecipients: recipients.length
    });
  } catch (error) {
    console.error('Error sending promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

