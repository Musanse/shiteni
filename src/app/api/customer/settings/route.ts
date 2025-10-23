import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    // Fetch user profile
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const profile = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        country: user.address?.country || 'Zambia'
      },
      preferences: {
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? true,
        marketingEmails: user.preferences?.marketingEmails ?? false,
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'Africa/Lusaka',
        currency: user.preferences?.currency || 'ZMW'
      },
      security: {
        twoFactorEnabled: user.security?.twoFactorEnabled ?? false,
        loginNotifications: user.security?.loginNotifications ?? true
      }
    };

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData = await request.json();
    await connectDB();

    // Verify user is customer
    const user = await User.findById(userId);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        address: {
          street: updateData.address.street,
          city: updateData.address.city,
          country: updateData.address.country
        },
        preferences: {
          emailNotifications: updateData.preferences.emailNotifications,
          smsNotifications: updateData.preferences.smsNotifications,
          marketingEmails: updateData.preferences.marketingEmails,
          language: updateData.preferences.language,
          timezone: updateData.preferences.timezone,
          currency: updateData.preferences.currency
        },
        security: {
          twoFactorEnabled: updateData.security.twoFactorEnabled,
          loginNotifications: updateData.security.loginNotifications
        },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        preferences: updatedUser.preferences,
        security: updatedUser.security
      }
    });

  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
