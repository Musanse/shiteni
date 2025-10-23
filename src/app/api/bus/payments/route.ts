import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// Bus Payment Schema
const BusPaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId },
  ticketId: { type: mongoose.Schema.Types.ObjectId },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  paymentMethod: { 
    type: String, 
    enum: ['mobile_money', 'card', 'cash', 'bank_transfer'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], 
    default: 'pending' 
  },
  transactionId: { type: String },
  reference: { type: String },
  tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tripName: { type: String, required: true },
  routeName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  busNumber: { type: String },
  seatNumber: { type: String },
  boardingPoint: { type: String },
  droppingPoint: { type: String },
  departureDate: { type: Date, required: true },
  departureTime: { type: String },
  paymentDate: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId },
  processedByName: { type: String },
  notes: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundDate: { type: Date },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear model cache
if (mongoose.models.BusPayment) {
  delete mongoose.models.BusPayment;
}

const BusPayment = mongoose.model('BusPayment', BusPaymentSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Define schemas for bookings and tickets
    const BusBookingSchema = new mongoose.Schema({
      bookingNumber: { type: String, required: true, unique: true },
      customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
      customerDetails: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true }
      },
      tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
      tripName: { type: String, required: true },
      routeName: { type: String, required: true },
      busId: { type: mongoose.Schema.Types.ObjectId, required: true },
      busName: { type: String, required: true },
      seatNumbers: [{ type: String, required: true }],
      boardingPoint: { type: String, required: true },
      droppingPoint: { type: String, required: true },
      fareAmount: { type: Number, required: true },
      currency: { type: String, default: 'ZMW' },
      paymentMethod: { type: String, enum: ['card', 'mobile_money'], required: true },
      paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paymentReference: { type: String },
      departureDate: { type: Date, required: true },
      departureTime: { type: String, required: true },
      status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
      bookingType: { type: String, enum: ['online', 'walk_in'], default: 'online' },
      busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

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
        email: { type: String }
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

    const BusDispatchSchema = new mongoose.Schema({
      dispatchId: { type: String, required: true, unique: true },
      tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
      tripName: { type: String, required: true },
      routeName: { type: String, required: true },
      busId: { type: mongoose.Schema.Types.ObjectId, required: true },
      busName: { type: String, required: true },
      busNumber: { type: String, required: true },
      departureDate: { type: Date, required: true },
      dispatchStop: { type: String, required: true },
      receiverContact: { type: String, required: true },
      parcelDescription: { type: String, required: true },
      parcelValue: { type: Number, required: true },
      billedPrice: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['scheduled', 'boarding', 'departed', 'in_transit', 'arrived', 'delayed', 'cancelled'], 
        default: 'scheduled' 
      },
      busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
      dispatchedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      dispatchedByName: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Clear model cache
    if (mongoose.models.BusBooking) delete mongoose.models.BusBooking;
    if (mongoose.models.BusTicket) delete mongoose.models.BusTicket;
    if (mongoose.models.BusDispatch) delete mongoose.models.BusDispatch;

    const BusBooking = mongoose.model('BusBooking', BusBookingSchema);
    const BusTicket = mongoose.model('BusTicket', BusTicketSchema);
    const BusDispatch = mongoose.model('BusDispatch', BusDispatchSchema);

    // Build base filter for bus company
    const baseFilter = { busCompanyId: session.user.id };

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { 'customerDetails.firstName': { $regex: search, $options: 'i' } },
          { 'customerDetails.lastName': { $regex: search, $options: 'i' } },
          { 'customerDetails.email': { $regex: search, $options: 'i' } },
          { 'customerDetails.phoneNumber': { $regex: search, $options: 'i' } },
          { 'passengerDetails.firstName': { $regex: search, $options: 'i' } },
          { 'passengerDetails.lastName': { $regex: search, $options: 'i' } },
          { 'passengerDetails.phoneNumber': { $regex: search, $options: 'i' } },
          { 'passengerDetails.email': { $regex: search, $options: 'i' } },
          { bookingNumber: { $regex: search, $options: 'i' } },
          { ticketNumber: { $regex: search, $options: 'i' } },
          { dispatchId: { $regex: search, $options: 'i' } },
          { tripName: { $regex: search, $options: 'i' } },
          { routeName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Fetch bookings
    const bookingFilter = {
      ...baseFilter,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(Object.keys(searchFilter).length > 0 ? searchFilter : {}),
      ...(status && status !== 'all' ? { paymentStatus: status } : {}),
      ...(paymentMethod && paymentMethod !== 'all' ? { paymentMethod: paymentMethod } : {})
    };

    const bookings = await BusBooking.find(bookingFilter)
      .sort({ createdAt: -1 })
      .lean();

    // Fetch tickets
    const ticketFilter = {
      ...baseFilter,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(Object.keys(searchFilter).length > 0 ? searchFilter : {}),
      ...(status && status !== 'all' ? { paymentStatus: status } : {}),
      ...(paymentMethod && paymentMethod !== 'all' ? { paymentMethod: paymentMethod } : {})
    };

    const tickets = await BusTicket.find(ticketFilter)
      .sort({ createdAt: -1 })
      .lean();

    // Fetch dispatch operations
    const dispatchFilter = {
      ...baseFilter,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(Object.keys(searchFilter).length > 0 ? searchFilter : {}),
      ...(status && status !== 'all' ? { status: status } : {}),
      ...(paymentMethod && paymentMethod !== 'all' ? { paymentMethod: 'cash' } : {}) // Dispatch payments are typically cash
    };

    const dispatches = await BusDispatch.find(dispatchFilter)
      .sort({ createdAt: -1 })
      .lean();

    // Transform bookings to payment format
    const bookingPayments = bookings.map(booking => ({
      _id: booking._id,
      paymentId: booking.bookingNumber,
      source: 'booking',
      customerId: booking.customerId,
      customerName: `${booking.customerDetails.firstName} ${booking.customerDetails.lastName}`,
      customerEmail: booking.customerDetails.email,
      customerPhone: booking.customerDetails.phoneNumber,
      amount: booking.fareAmount,
      currency: booking.currency,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus === 'paid' ? 'completed' : booking.paymentStatus,
      transactionId: booking.paymentReference,
      tripId: booking.tripId,
      tripName: booking.tripName,
      routeName: booking.routeName,
      busId: booking.busId,
      busName: booking.busName,
      seatNumber: booking.seatNumbers.join(', '),
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      departureDate: booking.departureDate,
      departureTime: booking.departureTime,
      paymentDate: booking.createdAt,
      processedBy: booking.busCompanyId,
      processedByName: 'System',
      busCompanyId: booking.busCompanyId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Transform tickets to payment format
    const ticketPayments = tickets.map(ticket => ({
      _id: ticket._id,
      paymentId: ticket.ticketNumber,
      source: 'ticket',
      customerId: ticket.soldBy,
      customerName: `${ticket.passengerDetails.firstName} ${ticket.passengerDetails.lastName}`,
      customerEmail: ticket.passengerDetails.email,
      customerPhone: ticket.passengerDetails.phoneNumber,
      amount: ticket.fareAmount,
      currency: ticket.currency,
      paymentMethod: ticket.paymentMethod,
      paymentStatus: ticket.paymentStatus === 'paid' ? 'completed' : ticket.paymentStatus,
      tripId: ticket.tripId,
      tripName: ticket.tripName,
      routeName: ticket.routeName,
      busId: ticket.busId,
      busName: ticket.busName,
      seatNumber: ticket.seatNumber,
      boardingPoint: ticket.boardingPoint,
      droppingPoint: ticket.droppingPoint,
      departureDate: ticket.departureDate,
      departureTime: ticket.departureTime,
      paymentDate: ticket.createdAt,
      processedBy: ticket.soldBy,
      processedByName: ticket.soldByName,
      busCompanyId: ticket.busCompanyId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));

    // Transform dispatches to payment format
    const dispatchPayments = dispatches.map(dispatch => ({
      _id: dispatch._id,
      paymentId: dispatch.dispatchId,
      source: 'dispatch',
      customerId: dispatch.dispatchedBy,
      customerName: dispatch.receiverContact,
      customerEmail: '',
      customerPhone: dispatch.receiverContact,
      amount: dispatch.billedPrice,
      currency: 'ZMW',
      paymentMethod: 'cash',
      paymentStatus: dispatch.status === 'arrived' ? 'completed' : 'pending',
      tripId: dispatch.tripId,
      tripName: dispatch.tripName,
      routeName: dispatch.routeName,
      busId: dispatch.busId,
      busName: dispatch.busName,
      busNumber: dispatch.busNumber,
      boardingPoint: dispatch.dispatchStop,
      droppingPoint: dispatch.dispatchStop,
      departureDate: dispatch.departureDate,
      paymentDate: dispatch.createdAt,
      processedBy: dispatch.dispatchedBy,
      processedByName: dispatch.dispatchedByName,
      notes: `Parcel: ${dispatch.parcelDescription} (Value: ${dispatch.parcelValue} ZMW)`,
      busCompanyId: dispatch.busCompanyId,
      createdAt: dispatch.createdAt,
      updatedAt: dispatch.updatedAt
    }));

    // Combine all payments
    const allPayments = [...bookingPayments, ...ticketPayments, ...dispatchPayments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Apply pagination
    const skip = (page - 1) * limit;
    const payments = allPayments.slice(skip, skip + limit);

    // Calculate statistics
    const stats = {
      totalAmount: allPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalPayments: allPayments.length,
      completedAmount: allPayments
        .filter(payment => payment.paymentStatus === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
      completedCount: allPayments.filter(payment => payment.paymentStatus === 'completed').length,
      pendingAmount: allPayments
        .filter(payment => payment.paymentStatus === 'pending')
        .reduce((sum, payment) => sum + payment.amount, 0),
      pendingCount: allPayments.filter(payment => payment.paymentStatus === 'pending').length,
      failedAmount: allPayments
        .filter(payment => payment.paymentStatus === 'failed')
        .reduce((sum, payment) => sum + payment.amount, 0),
      failedCount: allPayments.filter(payment => payment.paymentStatus === 'failed').length
    };

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total: allPayments.length,
        pages: Math.ceil(allPayments.length / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching bus payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
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

    await connectDB();

    const body = await request.json();
    const {
      bookingId,
      ticketId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      currency,
      paymentMethod,
      transactionId,
      reference,
      tripId,
      tripName,
      routeName,
      busId,
      busName,
      busNumber,
      seatNumber,
      boardingPoint,
      droppingPoint,
      departureDate,
      departureTime,
      processedBy,
      processedByName,
      notes
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!customerId) missingFields.push('customerId');
    if (!customerName || customerName.trim() === '') missingFields.push('customerName');
    if (!amount || isNaN(Number(amount))) missingFields.push('amount');
    if (!paymentMethod) missingFields.push('paymentMethod');
    if (!tripId) missingFields.push('tripId');
    if (!tripName || tripName.trim() === '') missingFields.push('tripName');
    if (!routeName || routeName.trim() === '') missingFields.push('routeName');
    if (!busId) missingFields.push('busId');
    if (!busName || busName.trim() === '') missingFields.push('busName');
    if (!departureDate) missingFields.push('departureDate');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment = new BusPayment({
      paymentId,
      bookingId,
      ticketId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      amount: Number(amount),
      currency: currency || 'ZMW',
      paymentMethod,
      transactionId,
      reference,
      tripId,
      tripName,
      routeName,
      busId,
      busName,
      busNumber,
      seatNumber,
      boardingPoint,
      droppingPoint,
      departureDate: new Date(departureDate),
      departureTime,
      processedBy: processedBy || session.user.id,
      processedByName: processedByName || session.user.name,
      busCompanyId: session.user.id,
      notes
    });

    await payment.save();

    return NextResponse.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Error creating bus payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
