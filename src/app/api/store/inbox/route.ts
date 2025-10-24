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

    // Find the store vendor
    const vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'store'
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Store vendor not found' }, { status: 404 });
    }

    console.log(`Searching for messages for store vendor: ${vendor.email} (ID: ${vendor._id})`);

    // Fetch all conversations for the store vendor
    const conversations = await (Message as any).aggregate([
      {
        $match: {
          $or: [
            { senderId: vendor._id.toString() },
            { recipientId: vendor._id.toString() }
          ],
          conversationId: vendor._id.toString()
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', vendor._id.toString()] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          customerName: { $first: '$senderName' },
          customerEmail: { $first: '$senderEmail' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$senderId', vendor._id.toString()] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    console.log(`Found ${conversations.length} conversations for store vendor: ${vendor.businessName || vendor.email}`);
    
    // Debug: Show sample conversations
    if (conversations.length > 0) {
      console.log('Sample conversations:', conversations.slice(0, 2).map(conv => ({
        customerName: conv.customerName,
        customerEmail: conv.customerEmail,
        lastMessage: conv.lastMessage.content?.substring(0, 50),
        timestamp: conv.lastMessage.timestamp
      })));
    }

    return NextResponse.json({
      success: true,
      vendorId: vendor._id.toString(),
      conversations: conversations.map(conv => ({
        _id: conv._id,
        customerName: conv.customerName,
        customerEmail: conv.customerEmail,
        lastMessage: conv.lastMessage.content,
        timestamp: conv.lastMessage.timestamp,
        unreadCount: conv.unreadCount,
        isFromMe: conv.lastMessage.senderId === vendor._id.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching store inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}
