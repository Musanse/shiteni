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

    // Find the hotel vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.businessId) {
        // Find the actual hotel vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing inbox for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    console.log(`Searching for messages for hotel vendor: ${vendor.email} (ID: ${vendor._id})`);

    // Fetch all conversations for the hotel vendor
    const conversations = await (Message as any).aggregate([
      {
        $match: {
          $or: [
            { senderId: vendor.email }, // Use email instead of ObjectId
            { recipientId: vendor.email } // Use email instead of ObjectId
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
              { $eq: ['$senderId', vendor.email] },
              '$recipientEmail',
              '$senderEmail'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          customerName: { 
            $first: {
              $cond: [
                { $eq: ['$senderId', vendor.email] },
                '$recipientName',
                '$senderName'
              ]
            }
          },
          customerEmail: { 
            $first: {
              $cond: [
                { $eq: ['$senderId', vendor.email] },
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
                    { $ne: ['$senderId', vendor.email] },
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

    console.log(`Found ${conversations.length} conversations for hotel vendor: ${vendor.hotelName || vendor.email}`);
    
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
      conversations: conversations.map(conv => ({
        _id: conv.customerEmail, // Use customer email as conversation ID
        customerName: conv.customerName,
        customerEmail: conv.customerEmail,
        lastMessage: conv.lastMessage.content,
        timestamp: conv.lastMessage.timestamp,
        unreadCount: conv.unreadCount,
        isFromMe: conv.lastMessage.senderId === vendor.email
      }))
    });

  } catch (error) {
    console.error('Error fetching hotel inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}

