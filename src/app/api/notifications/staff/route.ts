import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail, emailTemplates } from '@/lib/email';

// Send staff account creation notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { staffEmail, staffName, businessName, loginCredentials } = await request.json();

    if (!staffEmail || !staffName || !businessName || !loginCredentials) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Verify the requester is a manager/admin
    const requester = await (User as any).findById(session.user.id);
    if (!requester || !['manager', 'admin', 'super_admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Access denied. Manager privileges required.' }, { status: 403 });
    }

    // Send staff account creation email
    const emailTemplate = emailTemplates.staffAccountCreated(staffName, businessName, loginCredentials);
    const emailResult = await sendEmail(staffEmail, emailTemplate);

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Staff account notification sent successfully',
        messageId: emailResult.messageId
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send staff notification email',
        details: emailResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending staff notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
