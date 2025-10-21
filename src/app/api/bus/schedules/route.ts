import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BusRoute } from '@/models/Bus';
import mongoose from 'mongoose';

// Define fare segment interface
interface FareSegment {
  amount: number;
  fromStop: string;
  toStop: string;
}

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const departureCity = searchParams.get('departure');
    const arrivalCity = searchParams.get('arrival');
    const date = searchParams.get('date');

    // Get all active trips (these are the scheduled trips with segments)
    const trips = await BusTrip.find({ status: 'active' }).lean();
    
    if (trips.length === 0) {
      return NextResponse.json({
        success: true,
        schedules: [],
        routes: []
      });
    }

    // Generate schedules from trips for the requested date range
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const schedules = [];
    
    for (const trip of trips) {
      // Get route details (this contains stops and fare segments)
      const route = await BusRoute.findById(trip.routeId);
      if (!route) continue;
      
      // Get bus details
      const db = mongoose.connection.db;
      if (!db) continue;
      const bus = await db.collection('buses').findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });
      if (!bus) continue;
      
      // Generate schedules for each day in the next 30 days
      for (let scheduleDate = new Date(today); scheduleDate <= endDate; scheduleDate.setDate(scheduleDate.getDate() + 1)) {
        const dayName = scheduleDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if this day is included in the trip
        if (trip.daysOfWeek.includes(dayName)) {
          // Check if we should include this schedule based on filters
          let includeSchedule = true;
          
          if (date) {
            const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
            if (scheduleDateStr !== date) {
              includeSchedule = false;
            }
          }
          
          if (departureCity && route.origin && !route.origin.toLowerCase().includes(departureCity.toLowerCase())) {
            includeSchedule = false;
          }
          
          if (arrivalCity && route.destination && !route.destination.toLowerCase().includes(arrivalCity.toLowerCase())) {
            includeSchedule = false;
          }
          
          if (includeSchedule) {
            // Derive origin/destination from stops
            const firstStop = route.stops && route.stops.length > 0 ? route.stops[0] : null;
            const lastStop = route.stops && route.stops.length > 0 ? route.stops[route.stops.length - 1] : null;
            
            // Calculate total fare from segments
            const totalFare = route.fareSegments && route.fareSegments.length > 0 
              ? route.fareSegments.reduce((sum: number, segment: FareSegment) => sum + segment.amount, 0)
              : 100;
            
            // Calculate estimated distance and duration based on segments
            const estimatedDistance = route.fareSegments ? route.fareSegments.length * 50 : 200; // ~50km per segment
            const estimatedDuration = route.fareSegments ? route.fareSegments.length * 1 : 4; // ~1 hour per segment

            const schedule = {
              _id: `${trip._id}_${scheduleDate.toISOString().split('T')[0]}`,
              tripId: trip._id?.toString() || '',
              routeId: trip.routeId.toString(),
              busId: trip.busId.toString(),
              busName: bus.busName || `${bus.make || 'Unknown'} ${bus.model || 'Bus'}`,
              busNumber: bus.busNumberPlate || bus.busNumber || 'N/A',
              busImage: bus.image || bus.busImage || '/placeholder-bus.jpg',
              departureTime: trip.departureTimes.to,
              arrivalTime: trip.departureTimes.from,
              date: new Date(scheduleDate),
              totalSeats: bus.numberOfSeats || bus.capacity || 50,
              availableSeats: bus.numberOfSeats || bus.capacity || 50,
              totalFare: totalFare,
              amenities: bus.amenities || [],
              status: 'scheduled',
              // Route details with segments - use REAL data from bustrips
              routeName: trip.routeName,
              departureCity: firstStop?.stopName || 'Unknown',
              arrivalCity: lastStop?.stopName || 'Unknown',
              distance: route.totalDistance || route.distance || estimatedDistance,
              duration: route.duration || estimatedDuration,
              stops: route.stops || [],
              fareSegments: route.fareSegments || []
            };
            
            schedules.push(schedule);
          }
        }
      }
    }

    // Get unique routes for the routes section
    const uniqueRouteIds = [...new Set(trips.map(trip => trip.routeId.toString()))];
    const routeDetails = await BusRoute.find({ _id: { $in: uniqueRouteIds } }).lean();
    const routeMap = new Map(routeDetails.map(route => [route._id?.toString() || '', route]));

    return NextResponse.json({
      success: true,
      schedules: schedules,
      routes: trips.map(trip => {
        const route = routeMap.get(trip.routeId.toString());
        if (!route) return null;
        
        // Derive origin/destination from stops
        const firstStop = route.stops && route.stops.length > 0 ? route.stops[0] : null;
        const lastStop = route.stops && route.stops.length > 0 ? route.stops[route.stops.length - 1] : null;
        
        // Calculate total fare from segments
        const totalFare = route.fareSegments && route.fareSegments.length > 0 
          ? route.fareSegments.reduce((sum: number, segment: FareSegment) => sum + segment.amount, 0)
          : 100;
        
        // Calculate estimated distance and duration based on segments
        const estimatedDistance = route.fareSegments ? route.fareSegments.length * 50 : 200;
        const estimatedDuration = route.fareSegments ? route.fareSegments.length * 1 : 4;

        return {
          _id: trip.routeId.toString(),
          routeName: trip.routeName,
          origin: firstStop?.stopName || 'Unknown',
          destination: lastStop?.stopName || 'Unknown',
          distance: route.totalDistance || route.distance || estimatedDistance,
          duration: route.duration || estimatedDuration,
          totalFare: totalFare,
          stops: route.stops || []
        };
      }).filter(Boolean)
    });

  } catch (error) {
    console.error('Error fetching bus schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus schedules' },
      { status: 500 }
    );
  }
}
