import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { BusBooking } from '@/models/Bus';
import mongoose from 'mongoose';

// Get bookings for the bus vendor
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userServiceType = (session.user as { serviceType?: string })?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    // Find the bus vendor using the session email
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'bus'
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Bus vendor not found' }, { status: 404 });
    }

    const busCompanyId = vendor._id;
    
    // Get all bookings for this bus company
    const bookings = await BusBooking.find({})
      .sort({ bookingDate: -1 })
      .lean();
    
    // Filter bookings by bus company (we'll need to match scheduleId to trips)
    const BusTripSchema = new mongoose.Schema({}, { strict: false });
    const BusTrip = mongoose.models.BusTrip || mongoose.model('BusTrip', BusTripSchema);
    const trips = await BusTrip.find({ busCompanyId }).lean();
    const tripIds = trips.map(t => String(t._id));
    
    // Filter bookings that match our trips
    const companyBookings = bookings.filter(booking => {
      const scheduleId = booking.scheduleId as string;
      const tripId = scheduleId.split('_')[0];
      return tripIds.includes(tripId);
    });

    // Enhance bookings with bus and trip information
    const enhancedBookings = await Promise.all(companyBookings.map(async (booking) => {
      const scheduleId = booking.scheduleId as string;
      const tripId = scheduleId.split('_')[0];
      
      // Find the trip
      const trip = trips.find(t => String(t._id) === tripId);
      
      if (trip) {
        // Get bus information
        const db = mongoose.connection.db;
        if (db) {
          const bus = await db.collection('buses').findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });
          
          return {
            ...booking,
            tripName: trip.tripName,
            busName: bus?.busName || 'Unknown Bus',
            busPlateNumber: bus?.plateNumber || 'N/A',
            busId: trip.busId
          };
        }
      }
      
      return {
        ...booking,
        tripName: 'Unknown Trip',
        busName: 'Unknown Bus',
        busPlateNumber: 'N/A',
        busId: 'Unknown'
      };
    }));

    return NextResponse.json({
      success: true,
      bookings: enhancedBookings
    });
  } catch (error) {
    console.error('Error fetching bus bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// Bus booking API with segment support
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      scheduleId,
      passengerName,
      passengerEmail,
      passengerPhone,
      seatNumber,
      boardingStop,
      alightingStop,
      fare,
      paymentMethod
    } = body;

    // Validate required fields
    if (!scheduleId || !passengerName || !passengerEmail || !passengerPhone || !boardingStop || !alightingStop || !fare) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the schedule ID to get trip ID and date
    const scheduleIdParts = scheduleId.split('_');
    if (scheduleIdParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid schedule ID format' },
        { status: 400 }
      );
    }

    const tripId = scheduleIdParts[0];
    const scheduleDate = scheduleIdParts[1];
    
    // Find the trip using the bustrips collection
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const bustripsCollection = db.collection('bustrips');
    const trip = await bustripsCollection.findOne({ _id: new mongoose.Types.ObjectId(tripId) });
    if (!trip) {
    return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    // Get route and bus details using collections
    const busroutesCollection = db.collection('busroutes');
    const busesCollection = db.collection('buses'); // Changed from 'busfleet' to 'buses'
    
    const routeData = await busroutesCollection.findOne({ _id: new mongoose.Types.ObjectId(trip.routeId) });
    const bus = await busesCollection.findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });
    
    if (!routeData || !bus) {
      return NextResponse.json(
        { error: 'Route or bus not found' },
        { status: 404 }
      );
    }
    
    // Create a virtual schedule object for validation
    const schedule = {
      _id: scheduleId,
      routeId: trip.routeId,
      busId: trip.busId,
      date: new Date(scheduleDate),
      availableSeats: bus.numberOfSeats || bus.capacity || 50
    };

    // Check if seats are available
    if (schedule.availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No seats available' },
        { status: 400 }
      );
    }

    // Validate stops exist in the route and are in correct order
    const boardingStopData = routeData.stops.find((s: { stopName: string; order: number }) => s.stopName === boardingStop);
    const alightingStopData = routeData.stops.find((s: { stopName: string; order: number }) => s.stopName === alightingStop);

    if (!boardingStopData || !alightingStopData) {
      return NextResponse.json(
        { error: 'Invalid boarding or alighting stop' },
        { status: 400 }
      );
    }

    if (boardingStopData.order >= alightingStopData.order) {
      return NextResponse.json(
        { error: 'Alighting stop must come after boarding stop' },
        { status: 400 }
      );
    }

    // Generate unique booking number
    const bookingNumber = `BUS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const booking = new BusBooking({
      bookingNumber, // Unique booking reference
      scheduleId,
      customerId: 'guest', // For now, we'll use 'guest' for non-authenticated users
      passengerName,
      passengerEmail,
      passengerPhone,
      seatNumber: seatNumber || `AUTO-${Date.now()}`, // Auto-generate if not provided
      boardingPoint: boardingStop, // Use selected boarding stop
      destinationPoint: alightingStop, // Use selected alighting stop
      boardingStop: boardingStop, // NEW: boarding stop name
      alightingStop: alightingStop, // NEW: alighting stop name
      fare: fare, // Use calculated segment fare
      segmentFare: fare, // NEW: fare for selected segments
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'card',
      bookingDate: new Date(),
      travelDate: schedule.date,
      specialRequests: '',
      notes: `Booking for ${schedule.busId} from ${boardingStop} to ${alightingStop}`
    });

    await booking.save();

    // Note: Since schedules are generated dynamically, we don't update seat availability
    // In a real system, you might want to track bookings separately or use a different approach

    return NextResponse.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        scheduleId: booking.scheduleId,
        passengerName: booking.passengerName,
        passengerEmail: booking.passengerEmail,
        passengerPhone: booking.passengerPhone,
        seatNumber: booking.seatNumber,
        boardingStop: booking.boardingStop,
        alightingStop: booking.alightingStop,
        fare: booking.fare,
        segmentFare: booking.segmentFare,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        bookingDate: booking.bookingDate,
        travelDate: booking.travelDate
      },
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Error creating bus booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to create booking', details: errorMessage },
      { status: 500 }
    );
  }
}
