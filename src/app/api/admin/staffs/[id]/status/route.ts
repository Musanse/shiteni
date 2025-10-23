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

    const { status } = await request.json();
    const { id: staffId } = await params;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const staff = await User.findByIdAndUpdate(
      staffId,
      { status },
      { new: true }
    ).select('firstName lastName email role status');

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      staff,
      message: `Staff status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    return NextResponse.json(
      { error: 'Failed to update staff status' },
      { status: 500 }
    );
  }
}
