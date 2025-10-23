import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Fetch the loan to verify conversation exists
    const loan = await Loan.findById(conversationId);

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Import Message model
    const Message = (await import('@/models/Message')).default;
    
    // Fetch real messages from the database
    const realMessages = await Message.find({
      conversationId: conversationId,
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .lean();

    // If there are real messages, return them
    if (realMessages.length > 0) {
      const formattedMessages = realMessages.map(msg => ({
        _id: msg._id.toString(),
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        recipientId: msg.recipientId,
        recipientName: msg.recipientName,
        content: msg.content,
        type: msg.messageType || 'text',
        timestamp: msg.createdAt.toISOString(),
        read: msg.isRead,
        priority: 'medium',
        category: 'loan_inquiry'
      }));

      return NextResponse.json({ messages: formattedMessages });
    }

    // Generate initial mock messages based on loan status if no real messages exist
    const messages = [];
    const institutionName = loan.institutionName || 'Unknown Institution';

    // Application received message
    messages.push({
      _id: 'msg1',
      senderId: loan.institutionId.toString(),
      senderName: institutionName,
      senderRole: 'institution',
      recipientId: loan.customerId.toString(),
      recipientName: 'Customer',
      content: 'Your loan application has been received and is under review.',
      type: 'text',
      timestamp: loan.applicationDate.toISOString(),
      read: true,
      priority: 'medium',
      category: 'loan_inquiry'
    });

    // Status-specific messages
    switch (loan.status) {
      case 'under_review':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your application is being reviewed by our credit team.',
          type: 'text',
          timestamp: new Date(loan.applicationDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium',
          category: 'loan_inquiry'
        });
        break;

      case 'assessment':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your loan application is being assessed for approval.',
          type: 'text',
          timestamp: new Date(loan.applicationDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          category: 'loan_inquiry'
        });
        break;

      case 'approved':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Congratulations! Your loan application has been approved.',
          type: 'text',
          timestamp: loan.approvalDate?.toISOString() || new Date().toISOString(),
          read: false,
          priority: 'high',
          category: 'loan_inquiry'
        });
        break;

      case 'disbursement':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your loan is ready for disbursement. Please contact us to complete the process.',
          type: 'text',
          timestamp: loan.disbursementDate?.toISOString() || new Date().toISOString(),
          read: false,
          priority: 'high',
          category: 'loan_inquiry'
        });
        break;

      case 'recovery':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your loan is active. Next payment due soon.',
          type: 'text',
          timestamp: new Date().toISOString(),
          read: true,
          priority: 'medium',
          category: 'payment'
        });
        break;

      case 'defaulted':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your loan account requires immediate attention. Please contact us.',
          type: 'text',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'urgent',
          category: 'payment'
        });
        break;

      case 'rejected':
        messages.push({
          _id: 'msg2',
          senderId: loan.institutionId.toString(),
          senderName: institutionName,
          senderRole: 'institution',
          recipientId: loan.customerId.toString(),
          recipientName: 'Customer',
          content: 'Your loan application was not approved. Please contact us for more information.',
          type: 'text',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          category: 'loan_inquiry'
        });
        break;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, type = 'text' } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
    }

    // Save message to database
    await connectDB();
    
    const senderId = (session.user as any).id;
    const senderEmail = (session.user as any).email;
    const senderName = `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Customer';
    
    // Get recipient information from the conversation (loan)
    const Loan = (await import('@/models/Loan')).Loan;
    const loan = await Loan.findById(conversationId);
    
    if (!loan) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Import Message model
    const Message = (await import('@/models/Message')).default;
    
    // Get institution user email to use as recipientId
    // const institution = await Institution.findById(loan.institutionId);
    
    // Get institution admin user email
    const User = (await import('@/models/User')).User;
    const institutionUser = null; // institution ? await User.findById(institution.adminUserId) : null;
    const recipientEmail = institutionUser?.email || loan.institutionId.toString();
    
    // Create message
    const newMessage = await Message.create({
      senderId: senderEmail,
      senderName: senderName,
      senderRole: 'customer',
      recipientId: recipientEmail,
      recipientName: loan.institutionName || 'Institution',
      recipientRole: 'institution',
      conversationId: conversationId,
      messageType: type,
      content: content,
      isRead: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Customer message saved:', {
      conversationId,
      content,
      type,
      senderId,
      messageId: newMessage._id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: newMessage._id.toString()
    });
  } catch (error) {
    console.error('Error sending customer message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
