import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    console.log(`Marking messages as read for conversation: ${conversationId} by user: ${session.user.email}`);

    // Mark messages as read where:
    // 1. The conversationId matches
    // 2. The recipient is the current user (messages sent TO them)
    // 3. The messages are currently unread
    const result = await Message.updateMany(
      {
        conversationId: conversationId,
        recipientEmail: session.user.email,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read`);

    return NextResponse.json({
      success: true,
      markedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
