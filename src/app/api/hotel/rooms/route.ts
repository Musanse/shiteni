import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Room from '@/models/Room';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the hotel vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.businessId) {
        // Find the actual hotel vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing rooms for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    const rooms = await (Room as any).find({ vendorId: vendor._id.toString() }).sort({ createdAt: -1 });
    
    console.log(`Found ${rooms.length} rooms for hotel vendor: ${vendor.email}`);
    rooms.forEach((room, index) => {
      console.log(`Room ${index + 1}:`, {
        id: room._id,
        number: room.number,
        images: room.images,
        featuredImage: room.featuredImage
      });
    });
    
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the hotel vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.businessId) {
        // Find the actual hotel vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} creating room for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    // Only hotel managers and admins can create rooms
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'manager' && userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Received room data:', body);
    console.log('Images array:', body.images);
    console.log('Featured image:', body.featuredImage);
    
    const {
      number,
      type,
      floor,
      status,
      amenities,
      price,
      maxGuests,
      description,
      images,
      featuredImage,
      lastCleaned,
      nextMaintenance
    } = body;

    // Validate required fields
    if (!number || !type || !floor || !price || !maxGuests) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if room number already exists
    const existingRoom = await (Room as any).findOne({ 
      number, 
      vendorId: vendor._id.toString() 
    });
    
    if (existingRoom) {
      return NextResponse.json(
        { message: 'Room number already exists' },
        { status: 400 }
      );
    }

    const room = new Room({
      number,
      type,
      floor,
      status: status || 'available',
      amenities: amenities || [],
      price,
      maxGuests,
      description: description || '',
      images: images || [],
      featuredImage,
      lastCleaned,
      nextMaintenance,
      vendorId: vendor._id.toString()
    });

    console.log('Room object before save:', room);
    await (room as any).save();
    console.log('Room saved successfully:', room);
    
    return NextResponse.json({ 
      message: 'Room created successfully',
      room 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}