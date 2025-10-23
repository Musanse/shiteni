import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('role status firstName lastName email').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a vendor (manager role)
    if (user.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Access denied. Vendor role required.' 
      }, { status: 403 });
    }

    // Determine vendor status
    let vendorStatus = 'pending';
    let message = 'Your vendor application is pending approval.';
    let approved = false;

    if (user.status === 'active') {
      vendorStatus = 'approved';
      message = 'Your vendor account is approved and active. You can now list products and services.';
      approved = true;
    } else if (user.status === 'suspended') {
      vendorStatus = 'suspended';
      message = 'Your vendor account has been suspended. Please contact support for assistance.';
    } else if (user.status === 'inactive') {
      vendorStatus = 'rejected';
      message = 'Your vendor application was rejected. Please contact support for more information.';
    } else {
      vendorStatus = 'pending';
      message = 'Your vendor application is under review. Please wait for admin approval.';
    }

    return NextResponse.json({
      success: true,
      status: {
        approved,
        status: vendorStatus,
        message,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error checking vendor status:', error);
    return NextResponse.json(
      { error: 'Failed to check vendor status' },
      { status: 500 }
    );
  }
}
