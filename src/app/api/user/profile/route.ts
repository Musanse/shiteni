import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('User profile API - Session:', session);
    
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Add timeout for database connection
    const connectPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    const user = await (User as any).findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found in database for email:', session.user.email);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    console.log('User profile data:', {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      sessionName: session.user.name
    });

    return NextResponse.json({
      success: true,
      user: {
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || session.user.name || ''),
        email: user.email,
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
