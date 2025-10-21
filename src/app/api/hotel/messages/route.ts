import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as MessageModule from '@/models/Message';
import { User } from '@/models/User';
const Message = MessageModule.default;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the hotel vendor or staff member
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.institutionId) {
        // Find the actual hotel vendor using institutionId
        vendor = await User.findById(staff.institutionId);
        console.log(`Staff member ${staff.email} accessing messages for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const guestId = searchParams.get('guestId');

    let query: any = {
      $or: [
        { senderId: vendor._id.toString() },
        { recipientId: vendor._id.toString() }
      ],
      isDeleted: false
    };

    // If conversationId is provided, get messages for that conversation
    if (conversationId) {
      query.conversationId = conversationId;
    }

    // If guestId is provided, get messages with that guest
    if (guestId) {
      query.$or = [
        { senderId: vendor._id.toString(), recipientId: guestId },
        { senderId: guestId, recipientId: vendor._id.toString() }
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    console.log(`Found ${messages.length} messages for hotel vendor: ${vendor.email}`);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the hotel vendor or staff member
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.institutionId) {
        // Find the actual hotel vendor using institutionId
        vendor = await User.findById(staff.institutionId);
        console.log(`Staff member ${staff.email} sending message for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      recipientId,
      recipientName,
      recipientRole,
      content,
      messageType = 'text'
    } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { message: 'Recipient ID and content are required' },
        { status: 400 }
      );
    }

    // Generate conversation ID (vendor-guest or guest-vendor)
    const conversationId = [vendor._id.toString(), recipientId].sort().join('-');

    const message = new Message({
      senderId: vendor._id.toString(),
      senderName: vendor.firstName + ' ' + vendor.lastName || 'Hotel Staff',
      senderRole: 'manager',
      recipientId,
      recipientName,
      recipientRole: recipientRole || 'guest',
      conversationId,
      messageType,
      content,
      isRead: false
    });

    await message.save();

    return NextResponse.json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
