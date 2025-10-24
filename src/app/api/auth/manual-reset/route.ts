import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

// Manual password reset for admin use (when email fails)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, newPassword, adminKey } = await request.json();

    // Simple admin key check (you should use proper admin authentication)
    if (adminKey !== 'admin-reset-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Find user by email
    const user = await (User as any).findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await (User as any).findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}`
      }
    });

  } catch (error) {
    console.error('Error in manual password reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
