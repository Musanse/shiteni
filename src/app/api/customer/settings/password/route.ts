import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { currentPassword, newPassword } = await request.json();
    await connectDB();

    // Verify user is customer
    const user = await (User as any).findById(userId);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await (User as any).findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
