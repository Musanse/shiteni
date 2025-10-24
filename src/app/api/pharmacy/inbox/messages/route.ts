import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { publish } from '@/lib/sse';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};
    if (conversationId) query.conversationId = conversationId;

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

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      conversationId,
      content,
      messageType = 'text',
      recipientId = 'pharmacy-vendor',
      recipientName = 'Pharmacy Vendor',
      recipientRole = 'vendor',
      senderName,
    } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 });
    }

    const msg = await (Message as any).create({
      senderId: session?.user?.id || 'guest',
      senderName: senderName || session?.user?.name || 'Guest',
      senderRole: session?.user?.role || 'guest',
      recipientId,
      recipientName,
      recipientRole,
      conversationId,
      messageType,
      content,
      isRead: false,
      isDeleted: false,
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
