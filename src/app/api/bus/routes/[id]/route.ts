import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusRoute schema
const BusRouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  stops: [{
    stopId: { type: mongoose.Schema.Types.ObjectId, required: true },
    stopName: { type: String, required: true },
    order: { type: Number, required: true }
  }],
  fareSegments: [{
    from: { type: String, required: true },
    to: { type: String, required: true },
    fareId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true }
  }],
  totalDistance: Number,
  isBidirectional: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear any existing model to ensure we use the updated schema
if (mongoose.models.BusRoute) {
  delete mongoose.models.BusRoute;
}

const BusRoute = mongoose.model('BusRoute', BusRouteSchema);

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
    const { routeName, stops, fareSegments, totalDistance, status } = body;

    // Validate required fields
    if (!routeName || !stops || !Array.isArray(stops) || stops.length < 2) {
      return NextResponse.json({ error: 'Route name and at least 2 stops are required' }, { status: 400 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const { id } = await params;
    const route = await BusRoute.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        routeName,
        stops: stops.map((stop: any, index: number) => ({
          stopId: new mongoose.Types.ObjectId(stop.stopId),
          stopName: stop.stopName,
          order: index
        })),
        fareSegments: fareSegments || [],
        totalDistance: totalDistance ? parseFloat(totalDistance) : undefined,
        isBidirectional: true,
        status: status || 'active',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      route: {
        _id: route._id.toString(),
        routeName: route.routeName,
        stops: route.stops,
        fareSegments: route.fareSegments,
        totalDistance: route.totalDistance,
        isBidirectional: route.isBidirectional,
        status: route.status,
        createdAt: route.createdAt.toISOString(),
        updatedAt: route.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating bus route:', error);
    return NextResponse.json(
      { error: 'Failed to update route' },
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

    const busCompanyId = session.user.id;
    const { id } = await params;
    const route = await BusRoute.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
