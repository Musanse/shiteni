import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import * as UserModule from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
const { User } = UserModule;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const vendorId = searchParams.get('vendorId');
    const busId = searchParams.get('busId');

    // Support hotelId, vendorId, and busId parameters
    const targetId = hotelId || vendorId || busId;

    if (!targetId) {
      return NextResponse.json(
        { error: 'Hotel ID, Vendor ID, or Bus ID is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for messages between ${session.user.email} and ${targetId}`);
    
    // Check if current user is a vendor (hotel, bus, etc.)
    const currentUser = await (User as any).findOne({ email: session.user.email });
    console.log('Current user:', currentUser?.email, 'Role:', currentUser?.role, 'Service Type:', currentUser?.serviceType);
    
    let messages;
    
    if (currentUser?.serviceType && ['hotel', 'bus', 'store', 'pharmacy'].includes(currentUser.serviceType)) {
      // If current user is a vendor, find messages between vendor and customer
      console.log(`Vendor ${session.user.email} looking for messages with customer ${targetId}`);
      
      // Get the target user (customer) to find their ID
      const targetUser = await (User as any).findOne({ email: targetId });
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
      
      messages = await (Message as any).find({
        $or: [
          { senderId: currentUser._id.toString(), recipientId: targetUser._id.toString() },
          { senderId: targetUser._id.toString(), recipientId: currentUser._id.toString() }
        ]
      }).sort({ timestamp: 1 });
    } else {
      // If current user is customer, find messages between customer and vendor
      console.log(`Customer ${session.user.email} looking for messages with vendor ${targetId}`);
      
      // Get the target user (vendor) to find their ID
      const targetUser = await (User as any).findOne({ email: targetId });
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
      
      messages = await (Message as any).find({
        $or: [
          { senderId: currentUser._id.toString(), recipientId: targetUser._id.toString() },
          { senderId: targetUser._id.toString(), recipientId: currentUser._id.toString() }
        ]
      }).sort({ timestamp: 1 });
    }

    console.log(`Found ${messages.length} messages between ${session.user.email} and ${targetId}`);
    
    // Debug: Show sample messages
    if (messages.length > 0) {
      console.log('Sample messages:', messages.slice(0, 2).map(msg => ({
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content?.substring(0, 50),
        timestamp: msg.timestamp
      })));
    }

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        _id: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
        senderRole: msg.senderRole,
        recipientId: msg.recipientId,
        recipientName: msg.recipientName,
        recipientEmail: msg.recipientEmail,
        recipientRole: msg.recipientRole,
        conversationId: msg.conversationId, // Add this field
        content: msg.content,
        timestamp: msg.timestamp,
        isRead: msg.isRead
      }))
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
