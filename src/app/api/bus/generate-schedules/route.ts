import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { BusSchedule, BusRoute } from '@/models/Bus';

// Define BusTrip schema (same as in trips API)
const BusTripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  routeName: { type: String, required: true },
  departureTimes: {
    to: { type: String, required: true },
    from: { type: String, required: true }
  },
  daysOfWeek: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'cancelled'] },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BusTrip = mongoose.models.BusTrip || mongoose.model('BusTrip', BusTripSchema);

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

    await connectDB();

    const body = await request.json();
    const { tripId, startDate, endDate } = body;

    if (!tripId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: tripId, startDate, endDate' 
      }, { status: 400 });
    }

    // Find the trip
    const trip = await (BusTrip as any).findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get route and bus details
    const route = await (BusRoute as any).findById(trip.routeId);
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }
    const bus = await db.collection('buses').findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });

    if (!route || !bus) {
      return NextResponse.json({ 
        error: 'Route or bus not found' 
      }, { status: 404 });
    }

    // Generate schedules for the date range
    const schedules = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if this day is included in the trip
      if (trip.daysOfWeek.includes(dayName)) {
        // Create schedule for this day
        const schedule = new BusSchedule({
          routeId: trip.routeId.toString(),
          busId: trip.busId.toString(),
          departureTime: trip.departureTimes.to,
          arrivalTime: trip.departureTimes.from,
          date: new Date(date),
          totalSeats: bus.capacity || 50,
          availableSeats: bus.capacity || 50,
          fare: route.fare || 100,
          status: 'scheduled',
          driverId: 'driver_1',
          conductorId: 'conductor_1',
          notes: `Generated from trip: ${trip.tripName}`
        });

        schedules.push(schedule);
      }
    }

    // Save all schedules
    if (schedules.length > 0) {
      await BusSchedule.insertMany(schedules);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${schedules.length} schedules from trip`,
      schedulesCreated: schedules.length,
      tripName: trip.tripName
    });

  } catch (error) {
    console.error('Error generating schedules from trip:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedules' },
      { status: 500 }
    );
  }
}
