import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a hotel vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' && userRole !== 'admin' || userServiceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied. Hotel vendors only.' }, { status: 403 });
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract hotel settings from user document
    const hotelSettings = {
      name: user.hotelName || '',
      description: user.hotelDescription || '',
      address: user.address?.street || '',
      city: user.address?.city || '',
      country: user.address?.country || 'Zambia',
      phone: user.phone || '',
      email: user.email || '',
      website: user.website || '',
      currency: user.currency || 'ZMW',
      timezone: user.timezone || 'Africa/Lusaka',
      language: user.language || 'en',
      checkInTime: user.hotelCheckInTime || '15:00',
      checkOutTime: user.hotelCheckOutTime || '11:00',
      amenities: user.hotelAmenities || ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
      policies: user.hotelPolicies || {
        cancellation: 'Free cancellation up to 24 hours before check-in',
        pets: 'Pets allowed with additional fee',
        smoking: 'Non-smoking property',
        ageRestriction: 'Children under 12 stay free'
      },
      notifications: user.hotelNotifications || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        bookingAlerts: true,
        paymentAlerts: true,
        maintenanceAlerts: true,
        guestMessages: true,
        systemUpdates: false
      },
      security: user.hotelSecurity || {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: 'strong',
        loginAttempts: 5,
        ipWhitelist: '',
        auditLog: true
      },
      paymentSettings: user.hotelPaymentSettings || {
        acceptedMethods: ['credit_card', 'debit_card', 'cash', 'mobile_money'],
        processingFee: 2.5,
        refundPolicy: 'Full refund within 24 hours',
        taxRate: 10,
        serviceCharge: 5,
        currency: 'ZMW'
      },
      galleryImages: user.hotelGalleryImages || []
    };

    return NextResponse.json({
      success: true,
      settings: hotelSettings
    });

  } catch (error) {
    console.error('Error fetching hotel settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Hotel settings PUT request received');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id ? 'Found' : 'Not found');

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a hotel vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    console.log('User role:', userRole, 'Service type:', userServiceType);
    
    if (userRole !== 'manager' && userRole !== 'admin' || userServiceType !== 'hotel') {
      return NextResponse.json({ error: 'Access denied. Hotel vendors only.' }, { status: 403 });
    }

    await connectDB();
    console.log('Database connected');

    const body = await request.json();
    console.log('Request body received:', { ...body, password: '[HIDDEN]' });
    const {
      name,
      description,
      address,
      city,
      country,
      phone,
      email,
      website,
      currency,
      timezone,
      language,
      checkInTime,
      checkOutTime,
      amenities,
      policies,
      notifications,
      security,
      paymentSettings,
      galleryImages
    } = body;

    // Validate required fields
    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phone, email' },
        { status: 400 }
      );
    }

    // Update user document with hotel settings
    const updateData: any = {
      hotelName: name,
      hotelDescription: description,
      address: {
        street: address,
        city: city,
        country: country
      },
      phone,
      email,
      website,
      currency,
      timezone,
      language,
      hotelCheckInTime: checkInTime,
      hotelCheckOutTime: checkOutTime,
      hotelAmenities: amenities,
      hotelPolicies: policies,
      hotelNotifications: notifications,
      hotelSecurity: security,
      hotelPaymentSettings: paymentSettings,
      hotelGalleryImages: galleryImages,
      updatedAt: new Date()
    };

    console.log('Updating user with data:', updateData);
    
    const updatedUser = await (User as any).findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('User updated:', updatedUser ? 'Success' : 'Failed');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Hotel settings updated successfully',
      settings: {
        name: updatedUser.hotelName,
        description: updatedUser.hotelDescription,
        address: updatedUser.address?.street,
        city: updatedUser.address?.city,
        country: updatedUser.address?.country,
        phone: updatedUser.phone,
        email: updatedUser.email,
        website: updatedUser.website,
        currency: updatedUser.currency,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        checkInTime: updatedUser.hotelCheckInTime,
        checkOutTime: updatedUser.hotelCheckOutTime,
        amenities: updatedUser.hotelAmenities,
        policies: updatedUser.hotelPolicies,
        notifications: updatedUser.hotelNotifications,
        security: updatedUser.hotelSecurity,
        paymentSettings: updatedUser.hotelPaymentSettings
      }
    });

  } catch (error) {
    console.error('Error updating hotel settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
