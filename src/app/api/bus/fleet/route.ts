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

export async function GET(request: NextRequest) {
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

    const busCompanyId = session.user.id;
    const buses = await (Bus as any).find({ busCompanyId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      buses: buses.map(bus => ({
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
      }))
    });
  } catch (error) {
    console.error('Error fetching bus fleet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const busCompanyId = session.user.id;
    const bus = await (Bus as any).create({
      busName,
      busNumberPlate,
      numberOfSeats: parseInt(numberOfSeats),
      busType,
      hasAC: hasAC || false,
      image: image || '',
      status: status || 'active',
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

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
    console.error('Error creating bus:', error);
    return NextResponse.json(
      { error: 'Failed to create bus' },
      { status: 500 }
    );
  }
}
