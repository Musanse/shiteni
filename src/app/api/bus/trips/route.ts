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
    const trips = await (BusTrip as any).find({ busCompanyId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      trips: trips.map(trip => ({
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
      }))
    });
  } catch (error) {
    console.error('Error fetching bus trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
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
    const { tripName, busId, busName, routeId, routeName, departureTimes, daysOfWeek, status } = body;

    // Validate required fields
    if (!tripName || !busId || !busName || !routeId || !routeName || !departureTimes || !daysOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const trip = await (BusTrip as any).create({
      tripName,
      busId: new mongoose.Types.ObjectId(busId),
      busName,
      routeId: new mongoose.Types.ObjectId(routeId),
      routeName,
      departureTimes,
      daysOfWeek,
      status: status || 'active',
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

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
    console.error('Error creating bus trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
