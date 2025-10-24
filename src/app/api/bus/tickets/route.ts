import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusTicket schema
const BusTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tripName: { type: String, required: true },
  routeName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  passengerDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    idNumber: { type: String },
    idType: { type: String, enum: ['National ID', 'Passport', 'Drivers License', 'Other'] }
  },
  boardingPoint: { type: String, required: true },
  droppingPoint: { type: String, required: true },
  seatNumber: { type: String, required: true },
  fareAmount: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile_money'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'paid' },
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  status: { type: String, enum: ['active', 'used', 'cancelled', 'refunded'], default: 'active' },
  soldBy: { type: mongoose.Schema.Types.ObjectId, required: true }, // Staff member who sold the ticket
  soldByName: { type: String, required: true },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear any existing model to ensure we use the updated schema
if (mongoose.models.BusTicket) {
  delete mongoose.models.BusTicket;
}

const BusTicket = mongoose.model('BusTicket', BusTicketSchema);

// Generate unique ticket number
const generateTicketNumber = () => {
  const prefix = 'BT';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // Build filter
    const filter: any = { busCompanyId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.departureDate = { $gte: startDate, $lt: endDate };
    }

    const tickets = await (BusTicket as any).find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await (BusTicket as any).countDocuments(filter);

    return NextResponse.json({
      success: true,
      tickets: tickets.map(ticket => ({
        _id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        tripId: ticket.tripId.toString(),
        tripName: ticket.tripName,
        routeName: ticket.routeName,
        busId: ticket.busId.toString(),
        busName: ticket.busName,
        passengerDetails: ticket.passengerDetails,
        boardingPoint: ticket.boardingPoint,
        droppingPoint: ticket.droppingPoint,
        seatNumber: ticket.seatNumber,
        fareAmount: ticket.fareAmount,
        currency: ticket.currency,
        paymentMethod: ticket.paymentMethod,
        paymentStatus: ticket.paymentStatus,
        departureDate: ticket.departureDate.toISOString(),
        departureTime: ticket.departureTime,
        status: ticket.status,
        soldBy: ticket.soldBy.toString(),
        soldByName: ticket.soldByName,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bus tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
    const {
      tripId,
      tripName,
      routeName,
      busId,
      busName,
      passengerDetails,
      boardingPoint,
      droppingPoint,
      seatNumber,
      fareAmount,
      currency,
      paymentMethod,
      departureDate,
      departureTime
    } = body;

    // Validate required fields
    if (!tripId || !passengerDetails?.firstName || !passengerDetails?.lastName || 
        !passengerDetails?.phoneNumber || !boardingPoint || !droppingPoint || 
        !seatNumber || !fareAmount || !departureDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const busCompanyId = session.user.id;
    const ticketNumber = generateTicketNumber();

    const ticket = await (BusTicket as any).create({
      ticketNumber,
      tripId: new mongoose.Types.ObjectId(tripId),
      tripName,
      routeName,
      busId: new mongoose.Types.ObjectId(busId),
      busName,
      passengerDetails,
      boardingPoint,
      droppingPoint,
      seatNumber,
      fareAmount: parseFloat(fareAmount),
      currency: currency || 'ZMW',
      paymentMethod: paymentMethod || 'cash',
      departureDate: new Date(departureDate),
      departureTime,
      soldBy: new mongoose.Types.ObjectId(session.user.id),
      soldByName: (session.user as any).firstName + ' ' + (session.user as any).lastName,
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    return NextResponse.json({
      success: true,
      ticket: {
        _id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        tripId: ticket.tripId.toString(),
        tripName: ticket.tripName,
        routeName: ticket.routeName,
        busId: ticket.busId.toString(),
        busName: ticket.busName,
        passengerDetails: ticket.passengerDetails,
        boardingPoint: ticket.boardingPoint,
        droppingPoint: ticket.droppingPoint,
        seatNumber: ticket.seatNumber,
        fareAmount: ticket.fareAmount,
        currency: ticket.currency,
        paymentMethod: ticket.paymentMethod,
        paymentStatus: ticket.paymentStatus,
        departureDate: ticket.departureDate.toISOString(),
        departureTime: ticket.departureTime,
        status: ticket.status,
        soldBy: ticket.soldBy.toString(),
        soldByName: ticket.soldByName,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating bus ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
