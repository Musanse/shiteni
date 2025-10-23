import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { status } = await request.json();
    const messageId = params.id;

    if (!['unread', 'read', 'replied', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = { status };
    
    if (status === 'read' && !updateData.readAt) {
      updateData.readAt = new Date();
    } else if (status === 'replied') {
      updateData.repliedAt = new Date();
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    ).select('subject from status readAt repliedAt');

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message,
      message: `Message status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { error: 'Failed to update message status' },
      { status: 500 }
    );
  }
}
