import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the hotel vendor
    const hotelVendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    if (!hotelVendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      staffId,
      firstName,
      lastName,
      phone,
      department,
      salary,
      shift,
      status,
      performance,
      role,
      password
    } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Find the staff member
    const staffMember = await (User as any).findOne({
      _id: staffId,
      businessId: hotelVendor._id
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Update staff member
    const updateData: any = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (salary !== undefined) updateData.salary = salary;
    if (shift) updateData.shift = shift;
    if (status) updateData.status = status;
    if (performance) updateData.performance = performance;
    if (role) updateData.role = role;
    if (password) {
      // Hash the new password
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedStaff = await (User as any).findByIdAndUpdate(
      staffId,
      updateData,
      { new: true }
    ).select('-password');

    console.log(`Updated staff member: ${updatedStaff?.firstName} ${updatedStaff?.lastName}`);

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: {
        id: updatedStaff?._id.toString(),
        name: `${updatedStaff?.firstName} ${updatedStaff?.lastName}`,
        email: updatedStaff?.email,
        phone: updatedStaff?.phone || '',
        position: updatedStaff?.position || '',
        department: updatedStaff?.department || '',
        status: updatedStaff?.status || 'active',
        hireDate: updatedStaff?.createdAt?.toISOString().split('T')[0] || '',
        salary: updatedStaff?.salary || 0,
        shift: updatedStaff?.shift || 'flexible',
        emergencyContact: updatedStaff?.emergencyContact || '',
        address: updatedStaff?.address || '',
        skills: updatedStaff?.skills || [],
        performance: updatedStaff?.performance || 'good',
        notes: updatedStaff?.notes || '',
        role: updatedStaff?.role,
        kycStatus: updatedStaff?.kycStatus || 'pending'
      }
    });

  } catch (error) {
    console.error('Error updating hotel staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the hotel vendor
    const hotelVendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    if (!hotelVendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Find the staff member
    const staffMember = await (User as any).findOne({
      _id: staffId,
      businessId: hotelVendor._id
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Soft delete - update status to terminated
    await (User as any).findByIdAndUpdate(staffId, {
      status: 'terminated',
      deletedAt: new Date()
    });

    console.log(`Terminated staff member: ${staffMember.firstName} ${staffMember.lastName}`);

    return NextResponse.json({
      success: true,
      message: 'Staff member terminated successfully'
    });

  } catch (error) {
    console.error('Error terminating hotel staff:', error);
    return NextResponse.json(
      { error: 'Failed to terminate staff member' },
      { status: 500 }
    );
  }
}
