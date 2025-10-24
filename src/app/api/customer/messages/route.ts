import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Fetch real messages from the database
    const realMessages = await (Message as any).find({
      $or: [
        { senderId: (session.user as any).id, recipientId: vendorId },
        { senderId: vendorId, recipientId: (session.user as any).id }
      ],
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .lean();

    // If there are real messages, return them
    if (realMessages.length > 0) {
      const formattedMessages = realMessages.map(msg => ({
        _id: msg._id.toString(),
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        recipientId: msg.recipientId,
        recipientName: msg.recipientName,
        content: msg.content,
        type: msg.messageType || 'text',
        timestamp: msg.createdAt.toISOString(),
        read: msg.isRead,
        priority: 'medium',
        category: 'vendor_inquiry'
      }));

      return NextResponse.json({ messages: formattedMessages });
    }

    // Generate initial mock messages if no real messages exist
    const messages = [
      {
        _id: 'msg1',
        senderId: vendorId,
        senderName: 'Vendor Support',
        senderRole: 'vendor',
        recipientId: (session.user as any).id,
        recipientName: 'Customer',
        content: 'Hello! How can we help you today?',
        type: 'text',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'medium',
        category: 'vendor_inquiry'
      }
    ];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, content, type = 'text' } = body;

    if (!vendorId || !content) {
      return NextResponse.json({ error: 'Vendor ID and content are required' }, { status: 400 });
    }

    // Save message to database
    await connectDB();
    
    const senderId = (session.user as any).id;
    const senderEmail = (session.user as any).email;
    const senderName = `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Customer';
    
    // Get vendor information
    const vendor = await (User as any).findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    // Create message
    const newMessage = await (Message as any).create({
      senderId: senderEmail,
      senderName: senderName,
      senderRole: 'customer',
      recipientId: vendor.email,
      recipientName: vendor.businessName || `${vendor.firstName} ${vendor.lastName}`,
      recipientRole: 'vendor',
      messageType: type,
      content: content,
      isRead: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Customer message saved:', {
      vendorId,
      content,
      type,
      senderId,
      messageId: newMessage._id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: newMessage._id.toString()
    });
  } catch (error) {
    console.error('Error sending customer message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}