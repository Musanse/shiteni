import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a store vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'store') {
      return NextResponse.json({ error: 'Access denied. Store vendors only.' }, { status: 403 });
    }

    await connectDB();

    // Find the user and their store settings
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract store settings from user document
    const storeSettings = {
      storeName: user.storeName || `${user.firstName} ${user.lastName}'s Store`,
      storeDescription: user.storeDescription || '',
      storeCategory: user.storeCategory || '',
      contactEmail: user.email || '',
      contactPhone: user.phone || '',
      profilePicture: user.profilePicture || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        country: user.address?.country || 'Zambia',
        zipCode: user.address?.zipCode || ''
      },
      businessHours: user.businessHours || {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '10:00', close: '16:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: false }
      },
      currency: user.currency || 'ZMW',
      timezone: user.timezone || 'Africa/Lusaka',
      language: user.language || 'en',
      notifications: user.notifications || {
        emailNotifications: true,
        smsNotifications: false,
        orderNotifications: true,
        inventoryNotifications: true,
        customerNotifications: true
      },
      appearance: user.appearance || {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logo: '',
        favicon: ''
      },
      security: user.security || {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: 'medium'
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: storeSettings 
    });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a store vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'store') {
      return NextResponse.json({ error: 'Access denied. Store vendors only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      storeName,
      storeDescription,
      storeCategory,
      contactEmail,
      contactPhone,
      profilePicture,
      address,
      businessHours,
      currency,
      timezone,
      language,
      notifications,
      appearance,
      security
    } = body;

    // Validate required fields
    if (!storeName || !storeCategory || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update user document with store settings
    const updateData: any = {
      storeName,
      storeDescription,
      storeCategory,
      email: contactEmail,
      phone: contactPhone,
      profilePicture,
      address,
      businessHours,
      currency,
      timezone,
      language,
      notifications,
      appearance,
      security,
      updatedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Store settings updated successfully',
      data: {
        storeName: updatedUser.storeName,
        storeDescription: updatedUser.storeDescription,
        storeCategory: updatedUser.storeCategory,
        contactEmail: updatedUser.email,
        contactPhone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture,
        address: updatedUser.address,
        businessHours: updatedUser.businessHours,
        currency: updatedUser.currency,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        notifications: updatedUser.notifications,
        appearance: updatedUser.appearance,
        security: updatedUser.security
      }
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    return NextResponse.json(
      { error: 'Failed to update store settings' },
      { status: 500 }
    );
  }
}
