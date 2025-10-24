import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user);
    console.log('Looking for hotel vendor with email:', session.user.email);

    // Get the hotel vendor - try multiple approaches
    let hotelVendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found with serviceType, try without it
    if (!hotelVendor) {
      hotelVendor = await (User as any).findOne({ 
        email: session.user.email
      });
      console.log('Found user without serviceType filter:', hotelVendor);
    }

    console.log('Final hotel vendor:', hotelVendor);

    if (!hotelVendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    // Get all staff members for this hotel
    console.log('Searching for staff with businessId:', hotelVendor._id);
    console.log('Hotel vendor _id type:', typeof hotelVendor._id);
    
    const staff = await (User as any).find({
      businessId: hotelVendor._id,
      role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] }
    }).select('-password');

    console.log('Staff query result:', staff.length, 'members found');
    if (staff.length > 0) {
      console.log('First staff member:', {
        id: staff[0]._id,
        businessId: staff[0].businessId,
        role: staff[0].role,
        email: staff[0].email
      });
    }

    console.log(`Found ${staff.length} staff members for hotel: ${hotelVendor.businessName || hotelVendor.hotelName || hotelVendor.firstName + ' ' + hotelVendor.lastName}`);

    return NextResponse.json({
      success: true,
      staff: staff.map(member => ({
        id: member._id.toString(),
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        phone: member.phone || '',
        position: member.role || 'Staff', // Map role to position
        department: member.department || '',
        status: member.status || 'active',
        hireDate: member.createdAt?.toISOString().split('T')[0] || '',
        salary: member.salary || 0,
        shift: member.shift || 'flexible',
        skills: [], // Empty array for now since skills field doesn't exist in User model
        performance: member.performance || 'good',
        lastLogin: member.lastLogin?.toISOString() || '',
        role: member.role,
        kycStatus: member.kycStatus || 'pending'
      }))
    });

  } catch (error) {
    console.error('Error fetching hotel staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('POST - Session user:', session.user);
    console.log('POST - Looking for hotel vendor with email:', session.user.email);

    // Get the hotel vendor - try multiple approaches
    let hotelVendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found with serviceType, try without it
    if (!hotelVendor) {
      hotelVendor = await (User as any).findOne({ 
        email: session.user.email
      });
      console.log('POST - Found user without serviceType filter:', hotelVendor);
    }

    console.log('POST - Final hotel vendor:', hotelVendor);

    if (!hotelVendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('POST - Request body:', body);
    
    const {
      firstName,
      lastName,
      email,
      phone,
      department = 'General',
      salary,
      shift,
      role = 'receptionist',
      password
    } = body;

    console.log('POST - Extracted fields:', {
      firstName,
      lastName,
      email,
      phone,
      department,
      salary,
      shift,
      role,
      password: password ? '***provided***' : 'missing'
    });

    // Validate required fields (department is optional)
    if (!firstName || !lastName || !email || !password) {
      console.log('POST - Missing required fields:', {
        firstName: !firstName,
        lastName: !lastName,
        email: !email,
        password: !password
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await (User as any).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the provided password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new staff member
    console.log('Creating staff with businessId:', hotelVendor._id);
    console.log('Hotel vendor _id type:', typeof hotelVendor._id);
    
    const newStaff = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      department,
      salary: salary || 0,
      shift: shift || 'flexible',
      businessId: hotelVendor._id,
      serviceType: 'hotel',
      status: 'active',
      performance: 'good',
      kycStatus: 'pending',
      emailVerified: false, // Staff must verify email
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await (newStaff as any).save();
    
    console.log('Staff created with ID:', newStaff._id);
    console.log('Staff businessId:', newStaff.businessId);

    console.log(`Created new staff member: ${firstName} ${lastName} (${email}) for hotel: ${hotelVendor.businessName || hotelVendor.hotelName || hotelVendor.firstName + ' ' + hotelVendor.lastName}`);

    // Send verification email to the new staff member
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      const emailTemplate = emailTemplates.staffAccountCreated(
        `${firstName} ${lastName}`,
        hotelVendor.businessName || hotelVendor.hotelName || 'Hotel',
        { email, password: '[Password provided during creation]' }
      );
      
      const emailResult = await sendEmail(email, emailTemplate);
      
      if (emailResult.success) {
        console.log('✅ Verification email sent to hotel staff:', email);
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
      message: 'Staff member created successfully. A verification email has been sent to their email address.',
      staff: {
        id: newStaff._id.toString(),
        name: `${newStaff.firstName} ${newStaff.lastName}`,
        email: newStaff.email,
        phone: newStaff.phone || '',
        department: newStaff.department || '',
        status: newStaff.status || 'active',
        hireDate: newStaff.createdAt?.toISOString().split('T')[0] || '',
        salary: newStaff.salary || 0,
        shift: newStaff.shift || 'flexible',
        performance: newStaff.performance || 'good',
        role: newStaff.role,
        kycStatus: newStaff.kycStatus || 'pending',
        emailVerified: newStaff.emailVerified
      }
    });

  } catch (error) {
    console.error('Error creating hotel staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
