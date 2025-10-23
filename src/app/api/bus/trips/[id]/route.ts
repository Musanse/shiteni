import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusTrip schema
const BusTripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  routeName: { type: String, required: true },
  departureTimes: {
    to: { type: String, required: true }, // e.g., "08:00"
    from: { type: String, required: true } // e.g., "14:00"
  },
  daysOfWeek: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'cancelled'] },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear any existing model to ensure we use the updated schema
if (mongoose.models.BusTrip) {
  delete mongoose.models.BusTrip;
}

const BusTrip = mongoose.model('BusTrip', BusTripSchema);

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

    const { id } = await params;
    const body = await request.json();
    const { tripName, busId, busName, routeId, routeName, departureTimes, daysOfWeek, status } = body;

    // Validate required fields
    if (!tripName || !busId || !busName || !routeId || !routeName || !departureTimes || !daysOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const trip = await BusTrip.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        tripName,
        busId: new mongoose.Types.ObjectId(busId),
        busName,
        routeId: new mongoose.Types.ObjectId(routeId),
        routeName,
        departureTimes,
        daysOfWeek,
        status: status || 'active',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trip: {
        _id: trip._id.toString(),
        tripName: trip.tripName,
        busId: trip.busId.toString(),
        busName: trip.busName,
        routeId: trip.routeId.toString(),
        routeName: trip.routeName,
        departureTimes: trip.departureTimes,
        daysOfWeek: trip.daysOfWeek,
        status: trip.status,
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating bus trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
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

    const { id } = await params;
    await connectDB();

    const busCompanyId = session.user.id;
    const trip = await BusTrip.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
