import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST - Handle file uploads (documents, images, voice notes)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'institution'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string || 'document'; // 'document', 'image', 'voice'

    console.log('Upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: fileType,
      userRole: (session.user as any).role
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - support both generic types and custom document types
    const allowedTypes = {
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      voice: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
      // Custom document types for loan applications
      customer_id: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      customer_payslip: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      customer_bank_statement: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      guarantor_id: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      guarantor_payslip: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      guarantor_bank_statement: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      additional_docs: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
    };

    // Check if file type is valid
    const validTypes = allowedTypes[fileType as keyof typeof allowedTypes];
    if (!validTypes) {
      return NextResponse.json({ 
        error: `Invalid file type category: ${fileType}. Allowed categories: ${Object.keys(allowedTypes).join(', ')}` 
      }, { status: 400 });
    }

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type for ${fileType}. Allowed MIME types: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File saved successfully:', {
      fileName,
      filePath,
      fileSize: file.size,
      uploadType: fileType
    });

    // Generate public URL
    const fileUrl = `/uploads/${fileName}`;

    // Get file metadata
    const metadata = {
      originalFileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.user?.email
    };

    // For images, we could add thumbnail generation here
    if (fileType === 'image') {
      // In a real app, you'd generate thumbnails using sharp or similar
      metadata.thumbnailUrl = fileUrl; // For now, use same URL
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: fileName,
      fileUrl,
      originalFileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      metadata
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET - Get uploaded files list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'institution'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('fileType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // In a real app, you'd query a database for file metadata
    // For now, we'll return a mock response
    const mockFiles = [
      {
        id: '1',
        fileName: 'document.pdf',
        fileUrl: '/uploads/document/document.pdf',
        originalFileName: 'Important Document.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user?.email
      },
      {
        id: '2',
        fileName: 'image.jpg',
        fileUrl: '/uploads/image/image.jpg',
        originalFileName: 'Screenshot.png',
        fileSize: 512000,
        fileType: 'image/png',
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user?.email
      }
    ];

    return NextResponse.json({
      files: mockFiles,
      pagination: {
        page,
        limit,
        total: mockFiles.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
