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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Get customer details
    let customer = await (User as any).findById(session.user.id);
    if (!customer) {
      // If customer doesn't exist, create a customer record
      customer = new User({
        _id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0], // Use name from session or derive from email
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await (customer as any).save();
      console.log(`👤 Created new customer: ${customer.email} (${customer.name})`);
    }

    // Get vendor details
    const vendor = await (User as any).findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    console.log(`Fetching conversation between ${customer.email} and ${vendor.email}`);

    // Fetch all messages in this conversation
    const messages = await (Message as any).find({
      $or: [
        { senderId: customer._id.toString(), recipientId: vendorId },
        { senderId: vendorId, recipientId: customer._id.toString() }
      ]
    })
    .sort({ timestamp: 1 })
    .lean();

    // Mark messages as read
    await (Message as any).updateMany(
      {
        senderId: vendorId,
        recipientId: customer._id.toString(),
        isRead: false
      },
      { isRead: true }
    );

    console.log(`Found ${messages.length} messages in conversation`);

    return NextResponse.json({
      success: true,
      conversation: {
        vendor: {
          _id: vendor._id,
          name: vendor.businessName || vendor.name || vendor.email,
          email: vendor.email,
          serviceType: vendor.serviceType
        },
        customer: {
          _id: customer._id,
          name: customer.name || customer.email,
          email: customer.email
        },
        messages: messages.map(msg => ({
          _id: msg._id,
          content: msg.content,
          timestamp: msg.timestamp,
          isFromMe: msg.senderId === customer._id.toString(),
          isRead: msg.isRead,
          messageType: msg.messageType || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      vendorId, 
      content, 
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      fileType
    } = await request.json();

    if (!vendorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, content' },
        { status: 400 }
      );
    }

    // Get sender (customer) details
    const sender = await (User as any).findById(session.user.id);
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // Get vendor details
    const vendor = await (User as any).findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Create the message
    const message = new Message({
      senderId: sender._id.toString(),
      senderEmail: sender.email,
      senderName: sender.name || sender.email.split('@')[0],
      senderRole: sender.role || 'customer',
      recipientId: vendor._id.toString(),
      recipientEmail: vendor.email,
      recipientName: vendor.businessName || vendor.name || vendor.email.split('@')[0],
      recipientRole: vendor.role || 'vendor',
      conversationId: vendor._id.toString(),
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

    await (message as any).save();

    console.log(`📨 Message sent from ${sender.email} to ${vendor.email}`);

    return NextResponse.json({
      success: true,
      message: {
        _id: message._id,
        content: message.content,
        timestamp: message.timestamp,
        isFromMe: true,
        isRead: false,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        fileType: message.fileType
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
