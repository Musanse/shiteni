import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusDispatch schema
const BusDispatchSchema = new mongoose.Schema({
  dispatchId: { type: String, required: true, unique: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tripName: { type: String, required: true },
  routeName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  busNumber: { type: String, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId },
  driverName: { type: String },
  conductorId: { type: mongoose.Schema.Types.ObjectId },
  conductorName: { type: String },
  departureDate: { type: Date, required: true },
  dispatchStop: { type: String, required: true },
  receiverContact: { type: String, required: true },
  parcelDescription: { type: String, required: true },
  parcelValue: { type: Number, required: true },
  billedPrice: { type: Number, required: true },
  actualDeparture: { type: Date },
  actualArrival: { type: Date },
  status: { 
    type: String, 
    enum: ['scheduled', 'boarding', 'departed', 'in_transit', 'arrived', 'delayed', 'cancelled'], 
    default: 'scheduled' 
  },
  passengers: [{
    passengerId: { type: mongoose.Schema.Types.ObjectId },
    passengerName: { type: String },
    seatNumber: { type: String },
    boardingPoint: { type: String },
    droppingPoint: { type: String },
    status: { type: String, enum: ['confirmed', 'onboard', 'completed', 'no_show'] }
  }],
  totalPassengers: { type: Number, default: 0 },
  onboardPassengers: { type: Number, default: 0 },
  completedPassengers: { type: Number, default: 0 },
  noShowPassengers: { type: Number, default: 0 },
  maintenanceStatus: { type: String, enum: ['good', 'needs_check', 'maintenance_required'] },
  notes: { type: String },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  dispatchedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear any existing model to ensure we use the updated schema
if (mongoose.models.BusDispatch) {
  delete mongoose.models.BusDispatch;
}

const BusDispatch = mongoose.model('BusDispatch', BusDispatchSchema);

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const busId = searchParams.get('busId');
    const date = searchParams.get('date');

    // Get bus company ID from session
    const busCompanyId = session.user.id;

    // Build filter
    const filter: any = { busCompanyId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (busId && busId !== 'all') {
      filter.busId = busId;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.departureDate = { $gte: startDate, $lt: endDate };
    }

    const dispatches = await BusDispatch.find(filter)
      .sort({ departureDate: 1, departureTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await BusDispatch.countDocuments(filter);

    return NextResponse.json({
      success: true,
      dispatches: dispatches.map(dispatch => ({
        _id: dispatch._id.toString(),
        dispatchId: dispatch.dispatchId,
        tripId: dispatch.tripId.toString(),
        tripName: dispatch.tripName,
        routeName: dispatch.routeName,
        busId: dispatch.busId.toString(),
        busName: dispatch.busName,
        busNumber: dispatch.busNumber,
        driverId: dispatch.driverId?.toString(),
        driverName: dispatch.driverName,
        conductorId: dispatch.conductorId?.toString(),
        conductorName: dispatch.conductorName,
        departureDate: dispatch.departureDate.toISOString(),
        dispatchStop: dispatch.dispatchStop,
        receiverContact: dispatch.receiverContact,
        parcelDescription: dispatch.parcelDescription,
        parcelValue: dispatch.parcelValue,
        billedPrice: dispatch.billedPrice,
        actualDeparture: dispatch.actualDeparture?.toISOString(),
        actualArrival: dispatch.actualArrival?.toISOString(),
        status: dispatch.status,
        passengers: dispatch.passengers,
        totalPassengers: dispatch.totalPassengers,
        onboardPassengers: dispatch.onboardPassengers,
        completedPassengers: dispatch.completedPassengers,
        noShowPassengers: dispatch.noShowPassengers,
        maintenanceStatus: dispatch.maintenanceStatus,
        notes: dispatch.notes,
        dispatchedBy: dispatch.dispatchedBy.toString(),
        dispatchedByName: dispatch.dispatchedByName,
        createdAt: dispatch.createdAt.toISOString(),
        updatedAt: dispatch.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bus dispatches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatches' },
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

    await connectDB();

    const body = await request.json();
    const {
      tripId,
      tripName,
      routeName,
      busId,
      busName,
      busNumber,
      driverId,
      driverName,
      conductorId,
      conductorName,
      departureDate,
      dispatchStop,
      receiverContact,
      parcelDescription,
      parcelValue,
      billedPrice,
      maintenanceStatus,
      notes
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!tripId || tripId.trim() === '') missingFields.push('tripId');
    if (!tripName || tripName.trim() === '') missingFields.push('tripName');
    if (!routeName || routeName.trim() === '') missingFields.push('routeName');
    if (!busId || busId.trim() === '') missingFields.push('busId');
    if (!busName || busName.trim() === '') missingFields.push('busName');
    if (!departureDate || departureDate === '') missingFields.push('departureDate');
    if (!dispatchStop || dispatchStop.trim() === '') missingFields.push('dispatchStop');
    if (!receiverContact || receiverContact.trim() === '') missingFields.push('receiverContact');
    if (!parcelDescription || parcelDescription.trim() === '') missingFields.push('parcelDescription');
    if (parcelValue === undefined || parcelValue === null || parcelValue === '' || isNaN(Number(parcelValue))) missingFields.push('parcelValue');
    if (billedPrice === undefined || billedPrice === null || billedPrice === '' || isNaN(Number(billedPrice))) missingFields.push('billedPrice');

    // If busNumber is missing, try to fetch it from the bus data
    let finalBusNumber = busNumber;
    if (!busNumber || busNumber.trim() === '') {
      console.log('Bus number is missing, attempting to resolve from bus data...');
      console.log('Bus ID:', busId);
      console.log('Bus Name:', busName);
      
      try {
        const Bus = mongoose.model('Bus');
        const busData = await (Bus as any).findById(busId);
        console.log('Fetched bus data:', busData);
        
        if (busData) {
          finalBusNumber = busData.busNumberPlate || busName;
          console.log('Using bus number plate:', busData.busNumberPlate);
        } else {
          finalBusNumber = busName; // Fallback to bus name
          console.log('Bus not found, using bus name as fallback:', busName);
        }
      } catch (error) {
        console.log('Error fetching bus data:', error);
        finalBusNumber = busName;
      }
    } else {
      console.log('Bus number provided:', busNumber);
    }
    
    console.log('Final bus number:', finalBusNumber);

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      console.log('Received data:', { tripId, tripName, routeName, busId, busName, busNumber, departureDate, dispatchStop, receiverContact, parcelDescription, parcelValue, billedPrice });
      console.log('Data types:', {
        tripId: typeof tripId,
        tripName: typeof tripName,
        routeName: typeof routeName,
        busId: typeof busId,
        busName: typeof busName,
        departureDate: typeof departureDate,
        dispatchStop: typeof dispatchStop,
        receiverContact: typeof receiverContact,
        parcelDescription: typeof parcelDescription,
        parcelValue: typeof parcelValue,
        billedPrice: typeof billedPrice
      });
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique dispatch ID
    const dispatchId = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const dispatch = new BusDispatch({
      dispatchId,
      tripId,
      tripName,
      routeName,
      busId,
      busName,
      busNumber: finalBusNumber,
      driverId,
      driverName,
      conductorId,
      conductorName,
      departureDate: new Date(departureDate),
      dispatchStop,
      receiverContact,
      parcelDescription,
      parcelValue: parseFloat(parcelValue) || 0,
      billedPrice: parseFloat(billedPrice) || 0,
      maintenanceStatus: maintenanceStatus || 'good',
      notes,
      busCompanyId: session.user.id,
      dispatchedBy: session.user.id,
      dispatchedByName: session.user.name || 'Unknown'
    });

    await dispatch.save();

    return NextResponse.json({
      success: true,
      dispatch: {
        _id: dispatch._id.toString(),
        dispatchId: dispatch.dispatchId,
        tripId: dispatch.tripId.toString(),
        tripName: dispatch.tripName,
        routeName: dispatch.routeName,
        busId: dispatch.busId.toString(),
        busName: dispatch.busName,
        busNumber: dispatch.busNumber,
        driverId: dispatch.driverId?.toString(),
        driverName: dispatch.driverName,
        conductorId: dispatch.conductorId?.toString(),
        conductorName: dispatch.conductorName,
        departureDate: dispatch.departureDate.toISOString(),
        dispatchStop: dispatch.dispatchStop,
        receiverContact: dispatch.receiverContact,
        parcelDescription: dispatch.parcelDescription,
        parcelValue: dispatch.parcelValue,
        billedPrice: dispatch.billedPrice,
        status: dispatch.status,
        maintenanceStatus: dispatch.maintenanceStatus,
        notes: dispatch.notes,
        dispatchedBy: dispatch.dispatchedBy.toString(),
        dispatchedByName: dispatch.dispatchedByName,
        createdAt: dispatch.createdAt.toISOString(),
        updatedAt: dispatch.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating bus dispatch:', error);
    
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json(
        { error: 'Validation failed. Please check all required fields.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create dispatch' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { dispatchId, status, actualDeparture, actualArrival, notes } = body;

    if (!dispatchId || !status) {
      return NextResponse.json(
        { error: 'Dispatch ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['scheduled', 'boarding', 'departed', 'in_transit', 'arrived', 'delayed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = { 
      status,
      updatedAt: new Date()
    };

    if (actualDeparture) {
      updateData.actualDeparture = new Date(actualDeparture);
    }
    if (actualArrival) {
      updateData.actualArrival = new Date(actualArrival);
    }
    if (notes) {
      updateData.notes = notes;
    }

    const dispatch = await BusDispatch.findByIdAndUpdate(
      dispatchId,
      updateData,
      { new: true }
    );

    if (!dispatch) {
      return NextResponse.json(
        { error: 'Dispatch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dispatch: {
        _id: dispatch._id.toString(),
        dispatchId: dispatch.dispatchId,
        tripId: dispatch.tripId.toString(),
        tripName: dispatch.tripName,
        routeName: dispatch.routeName,
        busId: dispatch.busId.toString(),
        busName: dispatch.busName,
        busNumber: dispatch.busNumber,
        driverId: dispatch.driverId?.toString(),
        driverName: dispatch.driverName,
        conductorId: dispatch.conductorId?.toString(),
        conductorName: dispatch.conductorName,
        departureDate: dispatch.departureDate.toISOString(),
        dispatchStop: dispatch.dispatchStop,
        receiverContact: dispatch.receiverContact,
        parcelDescription: dispatch.parcelDescription,
        parcelValue: dispatch.parcelValue,
        billedPrice: dispatch.billedPrice,
        actualDeparture: dispatch.actualDeparture?.toISOString(),
        actualArrival: dispatch.actualArrival?.toISOString(),
        status: dispatch.status,
        passengers: dispatch.passengers,
        totalPassengers: dispatch.totalPassengers,
        onboardPassengers: dispatch.onboardPassengers,
        completedPassengers: dispatch.completedPassengers,
        noShowPassengers: dispatch.noShowPassengers,
        maintenanceStatus: dispatch.maintenanceStatus,
        notes: dispatch.notes,
        dispatchedBy: dispatch.dispatchedBy.toString(),
        dispatchedByName: dispatch.dispatchedByName,
        createdAt: dispatch.createdAt.toISOString(),
        updatedAt: dispatch.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating bus dispatch:', error);
    return NextResponse.json(
      { error: 'Failed to update dispatch' },
      { status: 500 }
    );
  }
}
