import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Find the pharmacy vendor
    const vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'pharmacy'
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Pharmacy vendor not found' }, { status: 404 });
    }

    const customer = await User.findById(customerId).select('name email').lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log(`Fetching conversation between ${vendor.email} and ${customer.email}`);

    // Fetch messages for this conversation
    const messages = await Message.find({
      $or: [
        { senderId: vendor._id.toString(), recipientId: customerId },
        { senderId: customerId, recipientId: vendor._id.toString() }
      ]
    })
      .sort({ timestamp: 1 })
      .lean();

    console.log(`Found ${messages.length} messages in conversation`);

    // Mark messages from the customer as read
    await Message.updateMany(
      { senderId: customerId, recipientId: vendor._id.toString(), isRead: false },
      { $set: { isRead: true } }
    );

    const formattedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      senderRole: msg.senderRole,
      recipientId: msg.recipientId,
      recipientName: msg.recipientName,
      recipientEmail: msg.recipientEmail,
      recipientRole: msg.recipientRole,
      conversationId: msg.conversationId,
      content: msg.content,
      messageType: msg.messageType,
      isRead: msg.isRead,
      timestamp: msg.timestamp.toISOString(),
      createdAt: msg.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      conversation: {
        vendor: {
          _id: vendor._id.toString(),
          name: vendor.name || vendor.email,
          email: vendor.email,
          serviceType: vendor.serviceType
        },
        customer: {
          _id: customer._id.toString(),
          name: customer.name || customer.email,
          email: customer.email
        },
        messages: formattedMessages
      }
    });

  } catch (error) {
    console.error('Error fetching pharmacy conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      customerId, 
      content, 
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      fileType
    } = await request.json();

    if (!customerId || !content) {
      return NextResponse.json({ error: 'Missing required fields: customerId, content' }, { status: 400 });
    }

    // Find the pharmacy vendor
    const vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'pharmacy'
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Pharmacy vendor not found' }, { status: 404 });
    }

    const customer = await User.findById(customerId).lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const message = new Message({
      senderId: vendor._id.toString(),
      senderEmail: vendor.email,
      senderName: vendor.businessName || vendor.name || vendor.email.split('@')[0],
      senderRole: vendor.role || 'vendor',
      recipientId: customer._id.toString(),
      recipientEmail: customer.email,
      recipientName: customer.name || customer.email.split('@')[0],
      recipientRole: customer.role || 'customer',
      conversationId: customer._id.toString(), // Conversation ID is the customer's ID
      content: content,
      messageType: messageType,
      isRead: false,
      timestamp: new Date(),
      // File attachment fields
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      fileType: fileType || undefined
    });

    await message.save();

    console.log(`📨 Message sent from ${vendor.email} to ${customer.email}`);

    return NextResponse.json({
      success: true,
      message: {
        _id: message._id.toString(),
        senderId: message.senderId,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        senderRole: message.senderRole,
        recipientId: message.recipientId,
        recipientName: message.recipientName,
        recipientEmail: message.recipientEmail,
        recipientRole: message.recipientRole,
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        isRead: message.isRead,
        timestamp: message.timestamp.toISOString(),
        createdAt: message.createdAt.toISOString(),
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        fileType: message.fileType
      }
    });

  } catch (error) {
    console.error('Error sending pharmacy message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
