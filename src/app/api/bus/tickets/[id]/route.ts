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
  soldBy: { type: mongoose.Schema.Types.ObjectId, required: true },
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const ticket = await BusTicket.findOne({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    }).lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

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
    console.error('Error fetching bus ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

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
    const { status, paymentStatus } = body;

    await connectDB();

    const busCompanyId = session.user.id;
    const ticket = await BusTicket.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        status: status || 'active',
        paymentStatus: paymentStatus || 'paid',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

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
    console.error('Error updating bus ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
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
    const ticket = await BusTicket.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
