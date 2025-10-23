import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    
    // Write file to disk
    await writeFile(filePath, buffer);
    
    // Return the public URL
    const imageUrl = `/uploads/${fileName}`;
    
    console.log('File uploaded successfully:', imageUrl);
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: imageUrl,
      url: imageUrl,
      fileName: fileName 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
