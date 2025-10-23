import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const body = await request.json();
    const { firstName, lastName, email, phone, role, permissions, status, department, password } = body;

    const update: any = {};
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;
    if (email) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (role) update.role = role;
    if (Array.isArray(permissions)) update.permissions = permissions;
    if (status) update.status = status;
    if (department !== undefined) update.department = department;
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    update.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(params.id, { $set: update }, { new: true });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}


