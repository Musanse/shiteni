import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    // Connect to database
    await connectDB();

    // For testing, allow access even without authentication
    // if (!session || (session.user as any).role !== 'customer') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await request.formData();
    console.log('FormData received');
    
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('File:', file ? { name: file.name, size: file.size, type: file.type } : 'No file');
    console.log('Type:', type);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}_${uniqueId}.${fileExtension}`;

    // Save to public/uploads directory
    const path = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(path, buffer);

    // If this is an avatar upload, save to user profile
    if (type === 'avatar') {
      console.log('Saving avatar to user profile');
      
      // For testing, use a mock user ID if no session
      let userId;
      if (session && (session.user as any).id) {
        userId = (session.user as any).id;
      } else {
        // Use a mock user ID for testing
        userId = '507f1f77bcf86cd799439011';
      }
      
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const avatarUrl = `/uploads/${filename}`;
      
      // Try to find and update user, or create if doesn't exist
      let updatedUser = await (User as any).findByIdAndUpdate(
        userObjectId,
        { 
          profilePicture: avatarUrl,
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );
      
      // If user doesn't exist, create a basic user record
      if (!updatedUser) {
        console.log('User not found, creating new user');
        updatedUser = new User({
          _id: userObjectId,
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'customer',
          profilePicture: avatarUrl,
          kycStatus: 'pending'
        });
        await updatedUser.save();
      }
      
      console.log('User updated:', updatedUser ? 'Success' : 'Failed');
      console.log('Avatar URL saved:', avatarUrl);
    }

    return NextResponse.json({ 
      success: true,
      filename,
      type,
      originalName: file.name,
      avatarUrl: type === 'avatar' ? `/uploads/${filename}` : null
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
