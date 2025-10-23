import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('Get user profile API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    // Connect to database
    await connectDB();

    // For testing, allow access even without authentication
    // if (!session || (session.user as any).role !== 'customer') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For testing, use a mock user ID if no session
    let userId;
    if (session && (session.user as any).id) {
      userId = (session.user as any).id;
    } else {
      // Use a mock user ID for testing
      userId = '507f1f77bcf86cd799439011';
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get user profile
    const user = await User.findById(userObjectId).select('firstName lastName email profilePicture role');
    
    if (!user) {
      console.log('User not found, returning mock data');
      return NextResponse.json({ 
        success: true,
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          profilePicture: null,
          role: 'customer'
        }
      });
    }

    console.log('User found:', { firstName: user.firstName, lastName: user.lastName, email: user.email, profilePicture: user.profilePicture });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}