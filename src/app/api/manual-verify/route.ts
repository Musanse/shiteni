import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log('Manual verification request:', { token, email });

    if (!token && !email) {
      return NextResponse.json({ error: 'Token or email required' }, { status: 400 });
    }

    await connectDB();
    console.log('Connected to database');

    let user;
    if (token) {
      // Verify by token
      console.log('Looking for user with token:', token);
      user = await (User as any).findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });
    } else if (email) {
      // Find user by email
      console.log('Looking for user with email:', email);
      user = await (User as any).findOne({ email });
    }

    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Update user as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('User verified successfully:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed',
        details: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}
