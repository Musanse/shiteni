import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import PharmacyStaff from '@/models/PharmacyStaff';
import { User } from '@/models/User';
import { sendEmail, emailTemplates } from '@/lib/email';
import crypto from 'crypto';

// Type definitions
interface SessionUser {
  id: string;
  email: string;
  role: string;
  serviceType?: string;
}

interface StaffQuery {
  serviceType: string;
  role: { $in: string[] } | string;
  businessId: mongoose.Types.ObjectId;
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
  status?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the pharmacy vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: (session.user as SessionUser).email,
      serviceType: 'pharmacy'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: (session.user as SessionUser).email,
        role: { $in: ['pharmacist', 'technician', 'cashier', 'manager', 'admin'] },
        serviceType: 'pharmacy'
      });
      
      if (staff && staff.businessId) {
        // Find the actual pharmacy vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing staff list for pharmacy vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Pharmacy vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build query for pharmacy staff
    const query: StaffQuery = {
      serviceType: 'pharmacy',
      role: { $in: ['pharmacist', 'technician', 'cashier', 'manager', 'admin'] },
      businessId: vendor._id
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const staff = await (User as any).find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await (User as any).countDocuments(query);

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
    console.error('Error fetching pharmacy staff:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch pharmacy staff',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy manager or admin
    const userRole = (session?.user as SessionUser)?.role;
    const userServiceType = (session?.user as SessionUser)?.serviceType;
    
    if (!userServiceType || userServiceType !== 'pharmacy' || !['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Manager or admin only.' }, { status: 403 });
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

    // Check if user ID is a valid ObjectId
    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid((session.user as SessionUser).id)) {
      return NextResponse.json({ 
        error: 'Invalid user session' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !role || !department || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, email, phone, role, department, password' 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingStaff = await (PharmacyStaff as any).findOne({ email });
    if (existingStaff) {
      return NextResponse.json({ 
        error: 'Email already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set default permissions based on role
    let permissions: string[] = [];
    switch (role) {
      case 'admin':
        permissions = ['all'];
        break;
      case 'manager':
        permissions = ['manage_staff', 'manage_inventory', 'view_reports'];
        break;
      case 'pharmacist':
        permissions = ['manage_prescriptions', 'view_inventory', 'manage_orders'];
        break;
      case 'technician':
        permissions = ['view_inventory', 'manage_orders'];
        break;
      case 'cashier':
        permissions = ['manage_orders', 'process_payments'];
        break;
    }

    const staff = await (PharmacyStaff as any).create({
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      licenseNumber: licenseNumber || '',
      status: 'active',
      permissions,
      hireDate: new Date(),
      pharmacyId: new mongoose.Types.ObjectId((session.user as SessionUser).id)
    });

    // Generate verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user account for the staff member
    await (User as any).create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      serviceType: 'pharmacy',
      businessId: (session.user as SessionUser).id,
      isActive: true,
      permissions,
      emailVerified: false, // Staff must verify email
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email to the new staff member
    try {
      const emailTemplate = emailTemplates.staffAccountCreated(
        firstName,
        'Pharmacy Business', // businessName
        { email: email, password: password }
      );
      const emailSent = await sendEmail(email, emailTemplate);

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
        // Don't fail the staff creation if email fails
      } else {
        console.log('✅ Verification email sent to:', email);
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the staff creation if email fails
    }

    return NextResponse.json({ 
      success: true, 
      staff,
      message: 'Staff member created successfully. A verification email has been sent to their email address.'
    });
  } catch (error) {
    console.error('Error creating pharmacy staff:', error);
    return NextResponse.json({ 
      error: 'Failed to create pharmacy staff',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
