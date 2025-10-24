import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

const STORE_STAFF_ROLES = ['cashier', 'inventory_manager', 'sales_associate', 'admin'];

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const query: any = { 
      serviceType: 'store',
      role: { $in: STORE_STAFF_ROLES },
      businessId: session.user.id
    };
    if (role && STORE_STAFF_ROLES.includes(role)) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await (User as any).find(query).sort({ createdAt: -1 }).lean();
    const staff = users.map(u => ({
      _id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      department: u.department || '',
      permissions: u.permissions || [],
      isActive: (u.status || 'active') === 'active',
      lastLogin: u.lastLogin || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error('Error fetching store staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { firstName, lastName, email, phone, role, department, permissions, password } = body;
    if (!firstName || !lastName || !email || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }
    if (!STORE_STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const existing = await (User as any).findOne({ email });
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    // Generate verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await (User as any).create({
      email,
      password: hashed,
      firstName,
      lastName,
      role,
      phone: phone || '',
      department: department || '',
      permissions: permissions || [],
      status: 'active',
      serviceType: 'store',
      businessId: session.user.id,
      createdBy: session.user.id,
      emailVerified: false, // Staff must verify email
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email to the new staff member
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      const emailTemplate = emailTemplates.staffAccountCreated(
        `${firstName} ${lastName}`,
        'Store',
        { email, password: '[Password provided during creation]' }
      );
      
      const emailResult = await sendEmail(email, emailTemplate);
      
      if (emailResult.success) {
        console.log('✅ Verification email sent to store staff:', email);
      } else {
        console.error('❌ Failed to send verification email to:', email);
        // Don't fail the staff creation if email fails
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the staff creation if email fails
    }

    return NextResponse.json({ 
      success: true, 
      staff: { _id: user._id },
      message: 'Staff member created successfully. A verification email has been sent to their email address.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}


