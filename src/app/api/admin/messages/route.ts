import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { User } from '@/models/User';

// GET - Fetch messages for a conversation or list conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // If action is 'conversations', return conversation list
    if (action === 'conversations') {
      // Get unique conversations with latest message info
      const conversations = await Message.aggregate([
        {
          $match: {
            isDeleted: false,
            $or: [
              { senderId: session.user?.email },
              { recipientId: session.user?.email }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$senderId', session.user?.email] },
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
          $lookup: {
            from: 'users',
            localField: 'lastMessage.senderId',
            foreignField: 'email',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.recipientId',
            foreignField: 'email',
            as: 'recipient'
          }
        },
        {
          $addFields: {
            id: '$_id',
            participantName: {
              $cond: [
                { $eq: ['$lastMessage.senderId', session.user?.email] },
                { $arrayElemAt: ['$recipient.firstName', 0] },
                { $arrayElemAt: ['$sender.firstName', 0] }
              ]
            },
            participantEmail: {
              $cond: [
                { $eq: ['$lastMessage.senderId', session.user?.email] },
                '$lastMessage.recipientId',
                '$lastMessage.senderId'
              ]
            },
            participantInstitution: {
              $cond: [
                { $eq: ['$lastMessage.senderId', session.user?.email] },
                { $arrayElemAt: ['$recipient.address.city', 0] },
                { $arrayElemAt: ['$sender.address.city', 0] }
              ]
            },
            participantRole: {
              $cond: [
                { $eq: ['$lastMessage.senderId', session.user?.email] },
                { $arrayElemAt: ['$recipient.role', 0] },
                { $arrayElemAt: ['$sender.role', 0] }
              ]
            },
            lastMessage: '$lastMessage.content',
            lastMessageTime: '$lastMessage.createdAt',
            messageType: '$lastMessage.messageType',
            priority: 'medium',
            isStarred: false,
            status: 'active'
          }
        },
        {
          $sort: { lastMessageTime: -1 }
        }
      ]);

      // Transform the results to remove MongoDB _id and ensure proper structure
      const transformedConversations = conversations.map(conv => ({
        id: conv.id,
        participantName: conv.participantName || 'Unknown',
        participantEmail: conv.participantEmail,
        participantInstitution: conv.participantInstitution || 'Unknown Institution',
        participantRole: conv.participantRole || 'institution',
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
        messageType: conv.messageType,
        priority: conv.priority,
        isStarred: conv.isStarred,
        status: conv.status
      }));

      return NextResponse.json({ conversations: transformedConversations });
    }

    // Otherwise, fetch messages for a specific conversation
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Fetch messages for the conversation
    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      conversationId,
      isDeleted: false
    });

    // Mark messages as read if they're not from the current user
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== session.user?.email && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: unreadMessages.map(msg => msg._id) },
          senderId: { $ne: session.user?.email }
        },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );
    }

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      recipientId,
      recipientName,
      recipientRole,
      conversationId,
      messageType,
      content,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      duration,
      metadata
    } = await request.json();

    if (!conversationId || !messageType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get sender information
    const sender = await User.findOne({ email: session.user?.email });
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    const newMessage = await Message.create({
      senderId: session.user?.email || '',
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderRole: sender.role,
      recipientId,
      recipientName,
      recipientRole,
      conversationId,
      messageType,
      content,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      duration,
      metadata,
      isRead: false
    });

    return NextResponse.json(
      { message: 'Message sent successfully', messageData: newMessage },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read or delete
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageIds, action } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || !action) {
      return NextResponse.json(
        { error: 'Missing messageIds or action' },
        { status: 400 }
      );
    }

    await connectDB();

    let updateData;
    switch (action) {
      case 'mark_read':
        updateData = { isRead: true, readAt: new Date() };
        break;
      case 'mark_unread':
        updateData = { isRead: false, readAt: null };
        break;
      case 'delete':
        updateData = { isDeleted: true, deletedAt: new Date() };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      updateData
    );

    return NextResponse.json({
      message: `Messages ${action.replace('_', ' ')} successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { error: 'Failed to update messages' },
      { status: 500 }
    );
  }
}
