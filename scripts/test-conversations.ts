import connectDB from '../src/lib/mongodb';
import Message from '../src/models/Message';
import { User } from '../src/models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConversations() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found.');
      return;
    }

    console.log('Admin user:', adminUser.email);

    // Test the aggregation pipeline
    const conversations = await Message.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [
            { senderId: adminUser.email },
            { recipientId: adminUser.email }
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
                    { $ne: ['$senderId', adminUser.email] },
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
              { $eq: ['$lastMessage.senderId', adminUser.email] },
              { $arrayElemAt: ['$recipient.firstName', 0] },
              { $arrayElemAt: ['$sender.firstName', 0] }
            ]
          },
          participantEmail: {
            $cond: [
              { $eq: ['$lastMessage.senderId', adminUser.email] },
              '$lastMessage.recipientId',
              '$lastMessage.senderId'
            ]
          },
          participantInstitution: {
            $cond: [
              { $eq: ['$lastMessage.senderId', adminUser.email] },
              { $arrayElemAt: ['$recipient.address.city', 0] },
              { $arrayElemAt: ['$sender.address.city', 0] }
            ]
          },
          participantRole: {
            $cond: [
              { $eq: ['$lastMessage.senderId', adminUser.email] },
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

    console.log('✅ Conversations found:', transformedConversations.length);
    console.log('Sample conversation:', JSON.stringify(transformedConversations[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error testing conversations:', error);
  } finally {
    process.exit(0);
  }
}

testConversations();
