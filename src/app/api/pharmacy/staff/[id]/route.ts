import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import PharmacyStaff from '@/models/PharmacyStaff';
import { User } from '@/models/User';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session?.user as any)?.role;
    const userServiceType = (session?.user as any)?.serviceType;
    
    if (!userServiceType || userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    await connectDB();

    const staff = await PharmacyStaff.findOne({
      _id: params.id,
      pharmacyId: new mongoose.Types.ObjectId(session?.user?.id)
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      staff
    });
  } catch (error) {
    console.error('Error fetching pharmacy staff:', error);
    return NextResponse.json({ error: 'Failed to fetch pharmacy staff' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy manager or admin
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Manager or admin only.' }, { status: 403 });
    }

    await connectDB();

    await connectDB();

    const body = await request.json();
    const updateData: any = {};

    // Only update provided fields
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber;
    if (body.status !== undefined) updateData.status = body.status;

    // Update permissions based on role if role is being updated
    if (body.role !== undefined) {
      let permissions: string[] = [];
      switch (body.role) {
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
      updateData.permissions = permissions;
    }

    const staff = await PharmacyStaff.findOneAndUpdate(
      {
        _id: params.id,
        pharmacyId: session.user.id
      },
      updateData,
      { new: true }
    );

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Update password if provided
    if (body.password && body.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(body.password, 12);
      
      // Update user account password
      await User.findOneAndUpdate(
        { email: staff.email },
        { password: hashedPassword }
      );
    }

    // Update user account if email or role changed
    if (body.email !== undefined || body.role !== undefined) {
      const userUpdateData: any = {};
      if (body.email !== undefined) userUpdateData.email = body.email;
      if (body.role !== undefined) {
        userUpdateData.role = body.role;
        userUpdateData.permissions = updateData.permissions;
      }
      
      await User.findOneAndUpdate(
        { email: staff.email },
        userUpdateData
      );
    }

    return NextResponse.json({ 
      success: true, 
      staff,
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Error updating pharmacy staff:', error);
    return NextResponse.json({ 
      error: 'Failed to update pharmacy staff',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy manager or admin
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Manager or admin only.' }, { status: 403 });
    }

    await connectDB();

    await connectDB();

    const staff = await PharmacyStaff.findOne({
      _id: params.id,
      pharmacyId: new mongoose.Types.ObjectId(session?.user?.id)
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Delete staff record
    await PharmacyStaff.findOneAndDelete({
      _id: params.id,
      pharmacyId: new mongoose.Types.ObjectId(session?.user?.id)
    });

    // Deactivate user account instead of deleting
    await User.findOneAndUpdate(
      { email: staff.email },
      { isActive: false }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pharmacy staff:', error);
    return NextResponse.json({ 
      error: 'Failed to delete pharmacy staff',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
