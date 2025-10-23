import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch all users
    const users = await User.find({}).select(
      'firstName lastName email phone role status kycStatus address city country createdAt lastLogin businessName businessType'
    ).lean();

    // Transform data for frontend
    const transformedUsers = users.map(user => ({
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status || 'active',
      kycStatus: user.kycStatus || 'pending',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      businessName: user.businessName || '',
      businessType: user.businessType || '',
      totalOrders: 0, // Will be calculated from actual data
      totalSpent: 0 // Will be calculated from actual data
    }));

    return NextResponse.json({ 
      success: true, 
      users: transformedUsers 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}