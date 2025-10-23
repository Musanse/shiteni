import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['pending', 'approved', 'suspended', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Map vendor status to user status
    let userStatus = 'pending'; // Default for vendors
    if (status === 'approved') {
      userStatus = 'active';
    } else if (status === 'suspended') {
      userStatus = 'suspended';
    } else if (status === 'rejected') {
      userStatus = 'inactive';
    } else if (status === 'pending') {
      userStatus = 'pending';
    }

    const updateData: any = {
      status: userStatus,
      updatedAt: new Date()
    };

    // Add timestamps based on status
    if (status === 'approved') {
      updateData.activatedAt = new Date();
      updateData.activatedBy = (session.user as any).id;
    } else if (status === 'suspended') {
      updateData.deactivatedAt = new Date();
      updateData.deactivatedBy = (session.user as any).id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('firstName lastName email status kycStatus createdAt updatedAt').lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Vendor status updated to ${status}`,
      vendor: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        status: status,
        kycStatus: updatedUser.kycStatus,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor status' },
      { status: 500 }
    );
  }
}