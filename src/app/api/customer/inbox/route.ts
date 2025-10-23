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

    // Get customer details
    let customer = await User.findById(session.user.id);
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
      await customer.save();
      console.log(`👤 Created new customer: ${customer.email} (${customer.name})`);
    }

    console.log(`Searching for messages for customer: ${customer.email} (ID: ${customer._id})`);

    // Fetch all conversations for the customer
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: customer._id.toString() },
            { recipientId: customer._id.toString() }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', customer._id.toString()] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          vendorName: {
            $first: {
              $cond: [
                { $eq: ['$senderId', customer._id.toString()] },
                '$recipientName',
                '$senderName'
              ]
            }
          },
          vendorEmail: {
            $first: {
              $cond: [
                { $eq: ['$senderId', customer._id.toString()] },
                '$recipientEmail',
                '$senderEmail'
              ]
            }
          },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$senderId', customer._id.toString()] },
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

    console.log(`Found ${conversations.length} conversations for customer: ${customer.email}`);
    
    // Debug: Show sample conversations
    if (conversations.length > 0) {
      console.log('Sample conversations:', conversations.slice(0, 2).map(conv => ({
        vendorName: conv.vendorName,
        vendorEmail: conv.vendorEmail,
        lastMessage: conv.lastMessage.content?.substring(0, 50),
        timestamp: conv.lastMessage.timestamp
      })));
    }

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        _id: conv._id,
        vendorName: conv.vendorName,
        vendorEmail: conv.vendorEmail,
        lastMessage: conv.lastMessage.content,
        timestamp: conv.lastMessage.timestamp,
        unreadCount: conv.unreadCount,
        isFromMe: conv.lastMessage.senderId === customer._id.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching customer inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}