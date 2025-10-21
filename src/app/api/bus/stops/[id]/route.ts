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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const busCompanyId = session.user.id;

    const stop = await BusStop.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        stopName,
        stopType,
        district,
        status: status || 'active',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

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
    console.error('Error updating bus stop:', error);
    return NextResponse.json(
      { error: 'Failed to update stop' },
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

    const userServiceType = (session.user as any)?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    const { id } = await params;
    const busCompanyId = session.user.id;

    const stop = await BusStop.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Stop deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus stop:', error);
    return NextResponse.json(
      { error: 'Failed to delete stop' },
      { status: 500 }
    );
  }
}
