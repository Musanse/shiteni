import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30'; // days

    // Define schemas for analytics
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

    const BusTripSchema = new mongoose.Schema({
      tripName: { type: String, required: true },
      routeName: { type: String, required: true },
      busId: { type: mongoose.Schema.Types.ObjectId, required: true },
      busName: { type: String, required: true },
      departureTime: { type: String, required: true },
      arrivalTime: { type: String, required: true },
      daysOfWeek: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
      isActive: { type: Boolean, default: true },
      busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Clear model cache
    if (mongoose.models.BusBooking) delete mongoose.models.BusBooking;
    if (mongoose.models.BusTicket) delete mongoose.models.BusTicket;
    if (mongoose.models.BusDispatch) delete mongoose.models.BusDispatch;
    if (mongoose.models.BusTrip) delete mongoose.models.BusTrip;

    const BusBooking = mongoose.model('BusBooking', BusBookingSchema);
    const BusTicket = mongoose.model('BusTicket', BusTicketSchema);
    const BusDispatch = mongoose.model('BusDispatch', BusDispatchSchema);
    const BusTrip = mongoose.model('BusTrip', BusTripSchema);

    // Build date filter
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const dateFilter = {
      $gte: startDateObj,
      $lte: endDateObj
    };

    const baseFilter = { busCompanyId: session.user.id };

    // Fetch all data
    const [bookings, tickets, dispatches, trips] = await Promise.all([
      BusBooking.find({ ...baseFilter, createdAt: dateFilter }).lean(),
      BusTicket.find({ ...baseFilter, createdAt: dateFilter }).lean(),
      BusDispatch.find({ ...baseFilter, createdAt: dateFilter }).lean(),
      BusTrip.find(baseFilter).lean()
    ]);

    // Calculate revenue analytics
    const totalRevenue = [
      ...bookings.filter(b => b.paymentStatus === 'paid').map(b => b.fareAmount),
      ...tickets.filter(t => t.paymentStatus === 'paid').map(t => t.fareAmount),
      ...dispatches.filter(d => d.status === 'arrived').map(d => d.billedPrice)
    ].reduce((sum, amount) => sum + amount, 0);

    const onlineRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.fareAmount, 0);

    const walkInRevenue = tickets
      .filter(t => t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.fareAmount, 0);

    const dispatchRevenue = dispatches
      .filter(d => d.status === 'arrived')
      .reduce((sum, d) => sum + d.billedPrice, 0);

    // Calculate passenger analytics
    const totalPassengers = bookings.length + tickets.length;
    const onlinePassengers = bookings.length;
    const walkInPassengers = tickets.length;

    // Calculate trip analytics
    const totalTrips = trips.length;
    const activeTrips = trips.filter(t => t.isActive).length;

    // Calculate route analytics
    const routeStats = {};
    [...bookings, ...tickets, ...dispatches].forEach(item => {
      const route = item.routeName;
      if (!routeStats[route]) {
        routeStats[route] = {
          routeName: route,
          bookings: 0,
          revenue: 0,
          passengers: 0
        };
      }
      routeStats[route].bookings += 1;
      routeStats[route].passengers += 1;
      
      if ('fareAmount' in item && item.paymentStatus === 'paid') {
        routeStats[route].revenue += item.fareAmount;
      } else if ('billedPrice' in item && item.status === 'arrived') {
        routeStats[route].revenue += item.billedPrice;
      }
    });

    const topRoutes = Object.values(routeStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate bus analytics
    const busStats = {};
    [...bookings, ...tickets, ...dispatches].forEach(item => {
      const busName = item.busName;
      if (!busStats[busName]) {
        busStats[busName] = {
          busName: busName,
          trips: 0,
          revenue: 0,
          passengers: 0
        };
      }
      busStats[busName].trips += 1;
      busStats[busName].passengers += 1;
      
      if ('fareAmount' in item && item.paymentStatus === 'paid') {
        busStats[busName].revenue += item.fareAmount;
      } else if ('billedPrice' in item && item.status === 'arrived') {
        busStats[busName].revenue += item.billedPrice;
      }
    });

    const topBuses = Object.values(busStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate daily revenue trend
    const dailyRevenue = {};
    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyRevenue[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    [...bookings.filter(b => b.paymentStatus === 'paid'), 
     ...tickets.filter(t => t.paymentStatus === 'paid'),
     ...dispatches.filter(d => d.status === 'arrived')].forEach(item => {
      const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
      if (dailyRevenue[dateKey] !== undefined) {
        if ('fareAmount' in item) {
          dailyRevenue[dateKey] += item.fareAmount;
        } else if ('billedPrice' in item) {
          dailyRevenue[dateKey] += item.billedPrice;
        }
      }
    });

    const revenueTrend = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    }));

    // Calculate payment method analytics
    const paymentMethodStats = {
      card: 0,
      mobile_money: 0,
      cash: 0,
      bank_transfer: 0
    };

    [...bookings, ...tickets].forEach(item => {
      if (item.paymentStatus === 'paid') {
        paymentMethodStats[item.paymentMethod] = (paymentMethodStats[item.paymentMethod] || 0) + item.fareAmount;
      }
    });

    dispatches.filter(d => d.status === 'arrived').forEach(dispatch => {
      paymentMethodStats.cash += dispatch.billedPrice;
    });

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDateObj.getTime() - (endDateObj.getTime() - startDateObj.getTime()));
    const previousPeriodEnd = new Date(startDateObj);

    const [prevBookings, prevTickets, prevDispatches] = await Promise.all([
      BusBooking.find({ 
        ...baseFilter, 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }).lean(),
      BusTicket.find({ 
        ...baseFilter, 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }).lean(),
      BusDispatch.find({ 
        ...baseFilter, 
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
      }).lean()
    ]);

    const previousRevenue = [
      ...prevBookings.filter(b => b.paymentStatus === 'paid').map(b => b.fareAmount),
      ...prevTickets.filter(t => t.paymentStatus === 'paid').map(t => t.fareAmount),
      ...prevDispatches.filter(d => d.status === 'arrived').map(d => d.billedPrice)
    ].reduce((sum, amount) => sum + amount, 0);

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const previousPassengers = prevBookings.length + prevTickets.length;
    const passengerGrowth = previousPassengers > 0 ? ((totalPassengers - previousPassengers) / previousPassengers) * 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRevenue,
          onlineRevenue,
          walkInRevenue,
          dispatchRevenue,
          totalPassengers,
          onlinePassengers,
          walkInPassengers,
          totalTrips,
          activeTrips,
          revenueGrowth,
          passengerGrowth
        },
        routes: {
          topRoutes,
          totalRoutes: Object.keys(routeStats).length
        },
        buses: {
          topBuses,
          totalBuses: Object.keys(busStats).length
        },
        trends: {
          revenueTrend,
          period: {
            startDate: startDateObj.toISOString(),
            endDate: endDateObj.toISOString(),
            days: Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
          }
        },
        paymentMethods: paymentMethodStats,
        summary: {
          totalBookings: bookings.length,
          totalTickets: tickets.length,
          totalDispatches: dispatches.length,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          activeTickets: tickets.filter(t => t.status === 'active').length,
          arrivedDispatches: dispatches.filter(d => d.status === 'arrived').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching bus analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
