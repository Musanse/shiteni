import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import Message from '@/models/Message';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { originalMessageId, content } = await request.json();

    await connectDB();

    // Verify user is customer
    const user = await (User as any).findById(userId);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get original message
    const originalMessage = await (Message as any).findById(originalMessageId);
    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
    }

    // Create reply message
    const replyMessage = new Message({
      senderId: userId,
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      recipientId: originalMessage.senderId,
      subject: `Re: ${originalMessage.subject}`,
      content,
      messageType: 'general',
      priority: 'medium',
      status: 'unread',
      relatedBookingId: originalMessage.relatedBookingId,
      relatedServiceType: originalMessage.relatedServiceType
    });

    await (replyMessage as any).save();

    // Update original message status to replied
    await (Message as any).findByIdAndUpdate(originalMessageId, { status: 'replied' });

    return NextResponse.json({
      success: true,
      message: replyMessage
    });

  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
