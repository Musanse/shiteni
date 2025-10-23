import { NextRequest } from 'next/server';
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
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return new Response('Hotel ID is required', { status: 400 });
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = JSON.stringify({ type: 'connected', message: 'Connected to chat' });
        controller.enqueue(`data: ${data}\n\n`);

        // Set up message monitoring
        const checkForNewMessages = async () => {
          try {
            const latestMessages = await Message.find({
              $or: [
                { senderId: session.user.email, recipientId: hotelId },
                { senderId: hotelId, recipientId: session.user.email }
              ],
              hotelId,
              timestamp: { $gte: new Date(Date.now() - 5000) } // Last 5 seconds
            }).sort({ timestamp: -1 }).limit(10);

            if (latestMessages.length > 0) {
              for (const msg of latestMessages) {
                const data = JSON.stringify({
                  type: 'message',
                  message: {
                    _id: msg._id,
                    senderName: msg.senderName,
                    senderEmail: msg.senderEmail,
                    senderType: msg.senderType,
                    message: msg.message,
                    timestamp: msg.timestamp,
                    isRead: msg.isRead
                  }
                });
                controller.enqueue(`data: ${data}\n\n`);
              }
            }
          } catch (error) {
            console.error('Error checking for new messages:', error);
          }
        };

        // Check for new messages every 2 seconds
        const interval = setInterval(checkForNewMessages, 2000);

        // Clean up on close
        const cleanup = () => {
          clearInterval(interval);
          controller.close();
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error setting up SSE:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
