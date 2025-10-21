import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const customerId = (session.user as any).id;
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Fetch loans for this customer to create conversations
    const loans = await Loan.find({ customerId: customerObjectId })
      .sort({ applicationDate: -1 });

    // Create conversation entries from loan data
    const conversations = loans.map(loan => {
      let lastMessage = '';
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
      let category: 'loan_inquiry' | 'payment' | 'support' | 'general' = 'loan_inquiry';
      let unreadCount = 0;

      switch (loan.status) {
        case 'pending_review':
          lastMessage = 'Your loan application has been received and is under review.';
          priority = 'medium';
          unreadCount = 1;
          break;
        case 'under_review':
          lastMessage = 'Your application is being reviewed by our team.';
          priority = 'medium';
          unreadCount = 1;
          break;
        case 'assessment':
          lastMessage = 'Your loan application is being assessed for approval.';
          priority = 'high';
          unreadCount = 1;
          break;
        case 'approved':
          lastMessage = 'Congratulations! Your loan application has been approved.';
          priority = 'high';
          unreadCount = 2;
          break;
        case 'disbursement':
          lastMessage = 'Your loan is ready for disbursement.';
          priority = 'high';
          unreadCount = 1;
          break;
        case 'recovery':
          lastMessage = 'Your loan is active. Next payment due soon.';
          priority = 'medium';
          category = 'payment';
          unreadCount = 0;
          break;
        case 'defaulted':
          lastMessage = 'Your loan account requires immediate attention.';
          priority = 'urgent';
          category = 'payment';
          unreadCount = 3;
          break;
        case 'rejected':
          lastMessage = 'Your loan application was not approved.';
          priority = 'medium';
          unreadCount = 1;
          break;
        default:
          lastMessage = 'We have an update regarding your loan application.';
          priority = 'low';
          unreadCount = 0;
      }

      return {
        _id: loan._id.toString(),
        participantId: loan.institutionId.toString(),
        participantName: loan.institutionName || 'Unknown Institution',
        participantRole: 'institution' as const,
        lastMessage,
        lastMessageTime: loan.updatedAt.toISOString(),
        unreadCount,
        priority,
        status: 'active' as const,
        category
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching customer conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer conversations' },
      { status: 500 }
    );
  }
}
