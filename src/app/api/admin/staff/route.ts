import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sendEmail, emailTemplates } from '@/lib/email';

// Available roles and permissions for admin-created staff
const availableRoles = [
  { value: 'admin', label: 'Administrator', permissions: ['admin', 'user_management', 'institution_management', 'system_admin'] },
  { value: 'compliance_officer', label: 'Compliance Officer', permissions: ['compliance', 'audit', 'reporting'] },
  { value: 'support_lead', label: 'Support Lead', permissions: ['support', 'customer_management'] },
  { value: 'system_admin', label: 'System Administrator', permissions: ['system_admin', 'technical_support'] },
  { value: 'analyst', label: 'Financial Analyst', permissions: ['financial_analysis', 'reporting'] },
  { value: 'staff', label: 'General Staff', permissions: ['basic_access'] }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Access models through mongoose.models
    const User = mongoose.models.User;

    // Verify model is available
    if (!User) {
      console.error('❌ User model not found');
      throw new Error('User model not found');
    }
    
    // Fetch all staff members (users with role 'staff' or other admin roles)
    const staff = await User.find({
      role: { $in: ['staff', 'admin', 'compliance_officer', 'support_lead', 'system_admin', 'analyst'] }
    })
      .select('-password') // Exclude password from response
      .sort({ createdAt: -1 })
      .lean();

    // Ensure all staff have required fields with defaults
    const staffWithDefaults = staff.map(member => ({
      ...member,
      permissions: member.permissions || [],
      status: member.status || 'active',
      joinDate: member.createdAt || new Date(),
      lastLogin: member.lastLogin || null,
      department: member.department || 'General',
      location: member.location || 'Not specified'
    }));

    return NextResponse.json({ staff: staffWithDefaults });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
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

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      permissions,
      location,
      password
    } = await request.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Access models through mongoose.models
    const User = mongoose.models.User;

    // Verify model is available
    if (!User) {
      console.error('❌ User model not found');
      throw new Error('User model not found');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new staff member
    console.log('Creating staff with role:', role);
    
    const newStaff = new User({
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      permissions: permissions || [],
      location,
      password: hashedPassword,
      status: 'active',
      createdBy: session.user?.email
    });

    await newStaff.save();

    // Send welcome email to the new staff member
    try {
      // Get business name for the email
      let businessName = 'Shiteni Platform';
      if (newStaff.businessName) {
        businessName = newStaff.businessName;
      }

      const staffName = `${newStaff.firstName} ${newStaff.lastName}`;
      const roleLabel = availableRoles.find(r => r.value === newStaff.role)?.label || newStaff.role;
      
      const emailTemplate = emailTemplates.staffWelcomeAdmin(
        staffName,
        businessName,
        roleLabel,
        password // Send the plain text password
      );

      const emailSent = await sendEmail({
        to: newStaff.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      if (!emailSent) {
        console.warn('Failed to send welcome email to:', newStaff.email);
      } else {
        console.log('Welcome email sent successfully to:', newStaff.email);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the staff creation if email fails
    }

    // Return user without password
    const { password: _, ...staffWithoutPassword } = newStaff.toObject();

    return NextResponse.json({ 
      message: 'Staff member created successfully',
      staff: staffWithoutPassword 
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { staffId, action } = await request.json();

    if (!staffId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Access models through mongoose.models
    const User = mongoose.models.User;

    // Verify model is available
    if (!User) {
      console.error('❌ User model not found');
      throw new Error('User model not found');
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { 
          status: 'active',
          activatedAt: new Date(),
          activatedBy: session.user?.email
        };
        message = 'Staff member activated successfully';
        break;
      
      case 'deactivate':
        updateData = { 
          status: 'inactive',
          deactivatedAt: new Date(),
          deactivatedBy: session.user?.email
        };
        message = 'Staff member deactivated successfully';
        break;
      
      case 'delete':
        await User.findByIdAndDelete(staffId);
        return NextResponse.json({ message: 'Staff member deleted successfully' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const staff = await User.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true }
    ).select('-password');

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message,
      staff 
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}
