import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the current user
    const user = await (User as any).findById(session.user.id).select('status role serviceType').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a vendor (has manager role or serviceType)
    const isVendor = user.role === 'manager' || user.serviceType;

    if (!isVendor) {
      return NextResponse.json({ 
        approved: true, 
        status: 'customer',
        message: 'Customer account - no approval needed'
      });
    }

    // Determine approval status based on user status
    let approved = false;
    let status = user.status || 'pending';

    switch (user.status) {
      case 'active':
        approved = true;
        status = 'approved';
        break;
      case 'pending':
        approved = false;
        status = 'pending';
        break;
      case 'suspended':
        approved = false;
        status = 'suspended';
        break;
      case 'inactive':
        approved = false;
        status = 'rejected';
        break;
      default:
        approved = false;
        status = 'pending';
    }

    return NextResponse.json({
      approved,
      status,
      message: approved 
        ? 'Vendor account is approved and active'
        : `Vendor account is ${status}`
    });

  } catch (error) {
    console.error('Error checking vendor approval status:', error);
    return NextResponse.json(
      { error: 'Failed to check vendor approval status' },
      { status: 500 }
    );
  }
}
