import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

const BUS_STAFF_ROLES = ['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance', 'admin'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a bus vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus vendors only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build query for bus staff
    const query: any = {
      serviceType: 'bus',
      role: { $in: BUS_STAFF_ROLES },
      institutionId: session.user.id
    };

    console.log('Fetching bus staff with query:', query);
    console.log('Session user ID:', session.user.id);

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && BUS_STAFF_ROLES.includes(role)) {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await User.countDocuments(query);
    console.log('Total staff found:', total);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log('Users found:', users.length);
    console.log('Sample user:', users[0]);

    const staff = users.map(user => ({
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      licenseNumber: user.licenseNumber || '',
      status: user.status || 'active',
      permissions: user.permissions || [],
      isActive: user.isActive !== false,
      emailVerified: user.emailVerified || false,
      lastLogin: user.lastLogin || null,
      hireDate: user.createdAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return NextResponse.json({
      success: true,
      staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bus staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a bus vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus vendors only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      licenseNumber,
      password
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone, role, password' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!BUS_STAFF_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${BUS_STAFF_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set default permissions based on role
    let permissions: string[] = [];
    switch (role) {
      case 'admin':
        permissions = ['all'];
        break;
      case 'dispatcher':
        permissions = ['manage_routes', 'manage_trips', 'view_reports', 'manage_staff'];
        break;
      case 'driver':
        permissions = ['view_routes', 'manage_trips', 'view_passengers'];
        break;
      case 'conductor':
        permissions = ['manage_tickets', 'view_passengers', 'process_payments'];
        break;
      case 'ticket_seller':
        permissions = ['manage_tickets', 'process_payments', 'view_bookings'];
        break;
      case 'maintenance':
        permissions = ['manage_fleet', 'view_reports'];
        break;
    }

    // Generate verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user account for the staff member
    console.log('Creating bus staff with data:', {
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      licenseNumber,
      institutionId: session.user.id
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      serviceType: 'bus',
      institutionId: session.user.id,
      department: department || '',
      licenseNumber: licenseNumber || '',
      isActive: true,
      status: 'active',
      permissions,
      emailVerified: false, // Staff must verify email
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    console.log('Bus staff created successfully:', user._id);

    // Send verification email to the new staff member
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
      
      const emailTemplate = emailTemplates.staffAccountCreated(
        `${firstName} ${lastName}`,
        'Bus Company',
        { email, password }
      );

      await sendEmail(email, emailTemplate);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      staff: {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        licenseNumber: user.licenseNumber,
        status: user.status,
        permissions: user.permissions,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Staff member created successfully. Verification email sent.'
    });

  } catch (error) {
    console.error('Error creating bus staff:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { error: `Validation failed: ${error.message}` },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
