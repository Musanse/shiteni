import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the admin user
    const admin = await (User as any).findOne({ 
      email: session.user.email,
      role: { $in: ['admin', 'super_admin'] }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    console.log(`Searching for messages for admin: ${admin.email} (ID: ${admin._id})`);

    // Fetch all conversations for the admin - simplified approach
    const conversations = await (Message as any).aggregate([
      {
        $match: {
          $or: [
            { senderId: admin._id.toString() },
            { recipientId: admin._id.toString() }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', admin._id.toString()] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$senderId', admin._id.toString()] },
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
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    console.log(`Found ${conversations.length} conversations for admin: ${admin.email}`);
    
    // Debug: Show sample conversations
    if (conversations.length > 0) {
      console.log('Sample conversations:', conversations.slice(0, 2).map(conv => ({
        participantId: conv._id,
        lastMessage: conv.lastMessage.content?.substring(0, 50),
        timestamp: conv.lastMessage.createdAt,
        unreadCount: conv.unreadCount
      })));
    }

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        _id: conv._id,
        participantId: conv._id,
        participantName: conv.lastMessage.senderId === admin._id.toString() 
          ? conv.lastMessage.recipientName 
          : conv.lastMessage.senderName,
        participantEmail: conv.lastMessage.senderId === admin._id.toString() 
          ? conv.lastMessage.recipientId 
          : conv.lastMessage.senderId,
        lastMessage: conv.lastMessage.content,
        timestamp: conv.lastMessage.createdAt,
        unreadCount: conv.unreadCount,
        isFromMe: conv.lastMessage.senderId === admin._id.toString(),
        messageType: conv.lastMessage.messageType || 'text',
        status: conv.lastMessage.status || 'sent'
      }))
    });

  } catch (error) {
    console.error('Error fetching admin inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}