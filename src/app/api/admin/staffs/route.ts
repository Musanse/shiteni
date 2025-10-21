import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch staff members (users with staff roles)
    const staffs = await User.find({
      role: { $in: ['receptionist', 'housekeeping', 'cashier', 'inventory_manager', 'sales_associate', 'pharmacist', 'technician', 'driver', 'conductor', 'dispatcher'] }
    }).select('firstName lastName email phone role businessType status createdAt lastLogin').lean();

    // Transform data for frontend
    const transformedStaffs = staffs.map(staff => ({
      _id: staff._id,
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      businessType: staff.businessType || '',
      permissions: [], // Will be implemented based on role
      status: staff.status || 'active',
      createdAt: staff.createdAt,
      createdBy: 'system', // Will be tracked properly
      lastLogin: staff.lastLogin
    }));

    return NextResponse.json({ 
      success: true, 
      staffs: transformedStaffs 
    });
  } catch (error) {
    console.error('Error fetching staffs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staffs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { firstName, lastName, email, phone, role, businessType, password } = body;

    if (!firstName || !lastName || !email || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create new staff member
    const staff = new User({
      firstName,
      lastName,
      email,
      phone: phone || '',
      role,
      businessType: businessType || '',
      password, // Will be hashed by the model
      status: 'active',
      kycStatus: 'pending'
    });

    await staff.save();

    return NextResponse.json({ 
      success: true, 
      staff: {
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        businessType: staff.businessType,
        status: staff.status
      },
      message: 'Staff member created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
