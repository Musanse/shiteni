import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Bus schema for the buses collection
const BusSchema = new mongoose.Schema({
  busName: { type: String, required: true },
  busNumberPlate: { type: String, required: true },
  numberOfSeats: { type: Number, required: true },
  busType: { type: String, required: true },
  hasAC: { type: Boolean, default: false },
  image: { type: String },
  status: { type: String, default: 'active' },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Bus = mongoose.models.Bus || mongoose.model('Bus', BusSchema);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    const body = await request.json();
    const { busName, busNumberPlate, numberOfSeats, busType, hasAC, image, status } = body;

    // Validate required fields
    if (!busName || !busNumberPlate || !numberOfSeats || !busType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const { id } = await params;
    const busCompanyId = session.user.id;

    const bus = await Bus.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        busName,
        busNumberPlate,
        numberOfSeats: parseInt(numberOfSeats),
        busType,
        hasAC: hasAC || false,
        image: image || '',
        status: status || 'active',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bus: {
        _id: bus._id.toString(),
        busName: bus.busName,
        busNumberPlate: bus.busNumberPlate,
        numberOfSeats: bus.numberOfSeats,
        busType: bus.busType,
        hasAC: bus.hasAC,
        image: bus.image || '',
        status: bus.status,
        createdAt: bus.createdAt.toISOString(),
        updatedAt: bus.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating bus:', error);
    return NextResponse.json(
      { error: 'Failed to update bus' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    const { id } = await params;
    const busCompanyId = session.user.id;

    const bus = await Bus.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    );
  }
}
