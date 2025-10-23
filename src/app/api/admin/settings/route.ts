import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock settings data - in a real application, this would be stored in database
    const settings = {
      general: {
        siteName: 'Shiteni',
        siteDescription: 'Multi-vending platform that transforms institutions into digital businesses',
        siteUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        adminEmail: 'admin@shiteni.com',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en'
      },
      security: {
        enableTwoFactor: false,
        sessionTimeout: 30,
        passwordMinLength: 8,
        enableEmailVerification: true,
        enableKycVerification: true,
        maxLoginAttempts: 5
      },
      email: {
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@shiteni.com',
        fromName: 'Shiteni Platform'
      },
      payment: {
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
        stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
        paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
        paypalSecret: process.env.PAYPAL_SECRET || '',
        enableMobileMoney: true
      },
      notifications: {
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enablePushNotifications: true,
        notificationFrequency: 'immediate'
      },
      maintenance: {
        maintenanceMode: false,
        maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back later.',
        allowAdminAccess: true
      }
    };

    return NextResponse.json({ 
      success: true, 
      settings 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // In a real application, you would save these settings to a database
    // For now, we'll just validate and return success
    console.log('Settings updated:', settings);

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}