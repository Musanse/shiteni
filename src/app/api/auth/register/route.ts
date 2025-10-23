import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
import { sendEmail, emailTemplates, generateVerificationToken } from '@/lib/email';
const { User } = UserModule;

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called');
    const body = await request.json();
    console.log('Request body received:', { ...body, password: '[HIDDEN]' });
    
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      phone, 
      businessName, 
      businessType, 
      businessAddress,
      licenseNumber,
      serviceType
    } = body;

    // Map businessType to serviceType for compatibility
    // Only set serviceType for vendor roles (manager/admin), not for customers
    const finalServiceType = (role === 'manager' || role === 'admin') ? (serviceType || businessType) : undefined;

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For manager role, require business-specific fields
    if (role === 'manager' && (!businessName || !finalServiceType || !businessAddress || !licenseNumber)) {
      return NextResponse.json(
        { message: 'Business name, type, address, and license number are required for business manager accounts' },
        { status: 400 }
      );
    }

    // For admin role, require serviceType
    if (role === 'admin' && !finalServiceType) {
      return NextResponse.json(
        { message: 'Service type is required for admin accounts' },
        { status: 400 }
      );
    }

    // For customer role, ensure no serviceType is provided
    if (role === 'customer' && (serviceType || businessType)) {
      return NextResponse.json(
        { message: 'Service type should not be provided for customer accounts' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('Database connected successfully');

    // Check if MongoDB is available
    if (!process.env.MONGODB_URI) {
      console.log('MONGODB_URI not found in environment');
      return NextResponse.json(
        { message: 'Database not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Creating user with data:', {
      firstName,
      lastName,
      email,
      role,
      phone,
      serviceType: finalServiceType
    });
    
    const userData: any = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Store combined name for messaging
      email,
      password: hashedPassword,
      role,
      phone,
      emailVerified: false, // Require email verification
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry,
      kycStatus: 'pending', // Set KYC status as pending
    };

    // Only add serviceType for vendor roles
    if (finalServiceType) {
      userData.serviceType = finalServiceType;
    }

    // Add business information for vendor roles
    if (role === 'manager' || role === 'admin') {
      // Store general business name for messaging
      userData.businessName = businessName;
      
      // Store business name based on service type
      if (finalServiceType === 'hotel') {
        userData.hotelName = businessName;
        userData.hotelDescription = businessAddress; // Using businessAddress as description for now
      } else if (finalServiceType === 'store') {
        userData.storeName = businessName;
        userData.storeDescription = businessAddress;
      } else if (finalServiceType === 'bus') {
        userData.busCompanyName = businessName;
        userData.busDescription = businessAddress;
      }
      
      // Store address information
      userData.address = {
        street: businessAddress || '',
        city: '', // Will be filled later in settings
        state: '',
        zipCode: '',
        country: 'Zambia'
      };
      
      // Store license number
      userData.licenseNumber = licenseNumber;
    }

    const user = new User(userData);

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Send verification email (optional - don't fail registration if email fails)
    let emailSent = false;
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      const emailTemplate = emailTemplates.userVerification(user.name || `${firstName} ${lastName}`, verificationLink);
      const emailResult = await sendEmail(email, emailTemplate);
      
      if (emailResult.success) {
        console.log('Verification email sent successfully:', emailResult.messageId);
        emailSent = true;
      } else {
        console.error('Failed to send verification email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      { 
        message: emailSent 
          ? 'User created successfully. Please check your email to verify your account.'
          : 'User created successfully. You can now sign in.',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        emailSent: emailSent
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific MongoDB errors
      if (error.message.includes('E11000')) {
        return NextResponse.json(
          { message: 'User already exists with this email' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { message: 'Invalid data provided. Please check your input.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}