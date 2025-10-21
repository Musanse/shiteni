import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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
    let hotelVendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found with serviceType, try without it
    if (!hotelVendor) {
      hotelVendor = await User.findOne({ 
        email: session.user.email
      });
      console.log('Found user without serviceType filter:', hotelVendor);
    }

    console.log('Final hotel vendor:', hotelVendor);

    if (!hotelVendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    // Get all staff members for this hotel
    console.log('Searching for staff with institutionId:', hotelVendor._id);
    console.log('Hotel vendor _id type:', typeof hotelVendor._id);
    
    const staff = await User.find({
      institutionId: hotelVendor._id,
      role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] }
    }).select('-password');

    console.log('Staff query result:', staff.length, 'members found');
    if (staff.length > 0) {
      console.log('First staff member:', {
        id: staff[0]._id,
        institutionId: staff[0].institutionId,
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
    let hotelVendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found with serviceType, try without it
    if (!hotelVendor) {
      hotelVendor = await User.findOne({ 
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the provided password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new staff member
    console.log('Creating staff with institutionId:', hotelVendor._id);
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
      institutionId: hotelVendor._id,
      serviceType: 'hotel',
      status: 'active',
      performance: 'good',
      kycStatus: 'pending',
      isEmailVerified: false
    });

    await newStaff.save();
    
    console.log('Staff created with ID:', newStaff._id);
    console.log('Staff institutionId:', newStaff.institutionId);

    console.log(`Created new staff member: ${firstName} ${lastName} (${email}) for hotel: ${hotelVendor.businessName || hotelVendor.hotelName || hotelVendor.firstName + ' ' + hotelVendor.lastName}`);

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
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
        kycStatus: newStaff.kycStatus || 'pending'
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
