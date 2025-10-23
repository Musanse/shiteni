import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusStop schema for the busstops collection
const BusStopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  stopType: { type: String, required: true, enum: ['stop', 'terminal'] },
  district: { type: String, required: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'maintenance'] },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BusStop = mongoose.models.BusStop || mongoose.model('BusStop', BusStopSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userServiceType = (session.user as any)?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const stops = await BusStop.find({ busCompanyId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      stops: stops.map(stop => ({
        _id: stop._id.toString(),
        stopName: stop.stopName,
        stopType: stop.stopType,
        district: stop.district,
        status: stop.status,
        createdAt: stop.createdAt.toISOString(),
        updatedAt: stop.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching bus stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stops' },
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

    const userServiceType = (session.user as any)?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    const body = await request.json();
    const { stopName, stopType, district, status } = body;

    // Validate required fields
    if (!stopName || !stopType || !district) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate stopType
    if (!['stop', 'terminal'].includes(stopType)) {
      return NextResponse.json({ error: 'Invalid stop type' }, { status: 400 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const stop = await BusStop.create({
      stopName,
      stopType,
      district,
      status: status || 'active',
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    return NextResponse.json({
      success: true,
      stop: {
        _id: stop._id.toString(),
        stopName: stop.stopName,
        stopType: stop.stopType,
        district: stop.district,
        status: stop.status,
        createdAt: stop.createdAt.toISOString(),
        updatedAt: stop.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating bus stop:', error);
    return NextResponse.json(
      { error: 'Failed to create stop' },
      { status: 500 }
    );
  }
}
