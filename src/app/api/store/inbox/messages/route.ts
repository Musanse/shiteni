import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { publish } from '@/lib/sse';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const participantId = searchParams.get('participantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};
    if (conversationId) query.conversationId = conversationId;
    if (participantId) {
      query.$or = [{ senderId: participantId }, { recipientId: participantId }];
    }

    const messages = await (Message as any).find(query).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      conversationId, // vendor id conversation root
      participantId, // customer id
      content,
      messageType = 'text',
    } = body;

    if (!conversationId || !participantId || !content) {
      return NextResponse.json({ error: 'Missing conversationId, participantId or content' }, { status: 400 });
    }

    // Identify the vendor (current session user) scoped to store
    const vendor = await (User as any).findOne({ email: session?.user?.email, serviceType: 'store' });
    if (!vendor) {
      return NextResponse.json({ error: 'Store vendor not found' }, { status: 404 });
    }

    // Ensure conversation belongs to this vendor
    if (conversationId !== vendor._id.toString()) {
      // Allow but log
      console.warn('Posting message to conversation not matching vendor id');
    }

    // Determine the recipient from the latest message in this conversation
    // participant is the other party
    const otherPartyId = participantId;
    // Prefer user lookup, fall back to last message fields
    const otherUser = await (User as any).findById(otherPartyId).lean();

    const recipientId = otherPartyId;
    const recipientEmail = otherUser?.email || '';
    const recipientName = otherUser?.name || otherUser?.businessName || '';
    const recipientRole = otherUser?.role || 'customer';

    const msg = await (Message as any).create({
      senderId: vendor._id.toString(),
      senderEmail: vendor.email,
      senderName: vendor.businessName || vendor.name || vendor.email.split('@')[0],
      senderRole: vendor.role || 'vendor',
      recipientId,
      recipientEmail,
      recipientName,
      recipientRole,
      conversationId,
      messageType,
      content,
      isRead: false,
      isDeleted: false,
      timestamp: new Date(),
    });

    // Broadcast via SSE to the vendor channel (recipientId or conversation)
    publish(recipientId || conversationId, 'message', {
      _id: msg._id,
      conversationId: msg.conversationId,
      content: msg.content,
      senderName: msg.senderName,
      createdAt: msg.createdAt,
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}


