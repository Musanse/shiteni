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

    // Check if user is a bus vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' && userRole !== 'admin' || userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus vendors only.' }, { status: 403 });
    }

    await connectDB();

    // Find the user and their bus settings
    const user = await (User as any).findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract bus settings from user document
    const busSettings = {
      companyName: user.busCompanyName || '',
      description: user.busDescription || '',
      address: user.address?.street || '',
      city: user.address?.city || '',
      country: user.address?.country || 'Zambia',
      phone: user.phone || '',
      email: user.email || '',
      website: user.website || '',
      currency: user.currency || 'ZMW',
      timezone: user.timezone || 'Africa/Lusaka',
      operatingHours: user.busOperatingHours || {
        start: '06:00',
        end: '22:00'
      },
      features: user.busFeatures || {
        onlineBooking: true,
        seatSelection: true,
        mobileApp: false,
        notifications: true,
        loyaltyProgram: false,
        groupBookings: true
      },
      policies: user.busPolicies || {
        cancellationPolicy: '',
        refundPolicy: '',
        termsOfService: '',
        privacyPolicy: ''
      },
      branding: user.busBranding || {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logo: '',
        companyImage: ''
      }
    };

    console.log('Retrieved bus settings:', {
      branding: busSettings.branding,
      userBusBranding: user.busBranding
    });

    return NextResponse.json({
      success: true,
      settings: busSettings
    });

  } catch (error) {
    console.error('Error fetching bus settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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

    // Check if user is a bus vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' && userRole !== 'admin' || userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus vendors only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      companyName,
      description,
      address,
      city,
      country,
      phone,
      email,
      website,
      currency,
      timezone,
      operatingHours,
      features,
      policies,
      branding
    } = body;

    // Validate required fields
    if (!companyName || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, phone, email' },
        { status: 400 }
      );
    }

    // Update user document with bus settings
    const updateData: any = {
      busCompanyName: companyName,
      busDescription: description,
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
      busOperatingHours: operatingHours,
      busFeatures: features,
      busPolicies: policies,
      busBranding: branding,
      updatedAt: new Date()
    };

    console.log('Updating bus settings with data:', updateData);

    const updatedUser = await (User as any).findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Bus settings updated successfully',
      settings: {
        companyName: updatedUser.busCompanyName,
        description: updatedUser.busDescription,
        address: updatedUser.address?.street,
        city: updatedUser.address?.city,
        country: updatedUser.address?.country,
        phone: updatedUser.phone,
        email: updatedUser.email,
        website: updatedUser.website,
        currency: updatedUser.currency,
        timezone: updatedUser.timezone,
        operatingHours: updatedUser.busOperatingHours,
        features: updatedUser.busFeatures,
        policies: updatedUser.busPolicies,
        branding: updatedUser.busBranding
      }
    });

  } catch (error) {
    console.error('Error updating bus settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
