import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Room from '@/models/Room';
import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    // Only hotel managers can update rooms
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
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

    await connectDB();

    const room = await Room.findOne({ 
      _id: params.id, 
      vendorId: user.id 
    });
    
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if room number already exists (excluding current room)
    if (number && number !== room.number) {
      const existingRoom = await Room.findOne({ 
        number, 
        vendorId: user.id,
        _id: { $ne: params.id }
      });
      
      if (existingRoom) {
        return NextResponse.json(
          { message: 'Room number already exists' },
          { status: 400 }
        );
      }
    }

    // Update room fields
    if (number !== undefined) room.number = number;
    if (type !== undefined) room.type = type;
    if (floor !== undefined) room.floor = floor;
    if (status !== undefined) room.status = status;
    if (amenities !== undefined) room.amenities = amenities;
    if (price !== undefined) room.price = price;
    if (maxGuests !== undefined) room.maxGuests = maxGuests;
    if (description !== undefined) room.description = description;
    if (images !== undefined) room.images = images;
    if (featuredImage !== undefined) room.featuredImage = featuredImage;
    if (lastCleaned !== undefined) room.lastCleaned = lastCleaned;
    if (nextMaintenance !== undefined) room.nextMaintenance = nextMaintenance;

    await room.save();
    
    return NextResponse.json({ 
      message: 'Room updated successfully',
      room 
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    // Only hotel managers can delete rooms
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const room = await Room.findOneAndDelete({ 
      _id: params.id, 
      vendorId: user.id 
    });
    
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
