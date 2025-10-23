import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Import models
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { BusRoute, BusSchedule, BusBooking } from '@/models/Bus';

// Connect to database
async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return mongoose.connection.db;
  }
  await mongoose.connect(process.env.MONGODB_URI!);
  return mongoose.connection.db;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();

    // Find the bus vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'bus'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: session.user.email,
        role: { $in: ['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance', 'admin'] },
        serviceType: 'bus'
      });
      
      if (staff && staff.businessId) {
        // Find the actual bus vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing dashboard for bus vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Bus vendor not found' }, { status: 404 });
    }

    const userId = vendor._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all bus-related data for this vendor using direct collection access
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    const [
      routes,
      schedules,
      bookings,
      fleet,
      staff
    ] = await Promise.all([
      // Get routes for this vendor
      db.collection('busroutes').find({ busCompanyId: userId }).toArray(),
      // Get trips for this vendor
      db.collection('bustrips').find({ busCompanyId: userId }).toArray(),
      // Get bookings for this vendor (filter by scheduleId matching vendor trips)
      db.collection('busbookings').find({}).toArray(),
      // Get fleet for this vendor
      db.collection('buses').find({ busCompanyId: userId }).toArray(),
      // Get staff members
      (User as any).find({ businessId: userId, serviceType: 'bus', role: { $in: ['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance'] } }).lean()
    ]);

    // Filter bookings to only include those for this vendor's trips
    const vendorTripIds = schedules.map(trip => trip._id.toString());
    const vendorBookings = bookings.filter(booking => {
      const scheduleId = booking.scheduleId;
      if (typeof scheduleId === 'string') {
        const tripId = scheduleId.split('_')[0];
        return vendorTripIds.includes(tripId);
      }
      return false;
    });

    // Calculate statistics
    const stats = {
      // Routes
      totalRoutes: routes.length,
      activeRoutes: routes.filter(route => route.status === 'active').length,
      
      // Trips (using schedules)
      totalTrips: schedules.length,
      todayTrips: schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= today && scheduleDate < tomorrow;
      }).length,
      
      // Passengers
      totalPassengers: vendorBookings.reduce((sum, booking) => sum + 1, 0), // Each booking is 1 passenger
      todayPassengers: vendorBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= today && bookingDate < tomorrow;
      }).length,
      
      // Revenue
      totalRevenue: vendorBookings.reduce((sum, booking) => sum + (booking.fare || 0), 0),
      todayRevenue: vendorBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= today && bookingDate < tomorrow;
      }).reduce((sum, booking) => sum + (booking.fare || 0), 0),
      
      // Fleet
      fleetSize: fleet.length,
      activeBuses: fleet.filter(bus => bus.status === 'active').length,
      
      // Bookings
      pendingBookings: vendorBookings.filter(booking => booking.status === 'pending').length,
      confirmedBookings: vendorBookings.filter(booking => booking.status === 'confirmed').length
    };

    // Get recent trips (last 5)
    const recentTrips = schedules
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(schedule => ({
        _id: schedule._id,
        routeName: schedule.routeId || 'Unknown Route',
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        passengers: schedule.totalSeats - schedule.availableSeats,
        status: schedule.status || 'scheduled',
        createdAt: schedule.createdAt
      }));

    // Get recent bookings (last 5)
    const recentBookings = vendorBookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(booking => ({
        _id: booking._id,
        passengerName: booking.passengerName || 'Unknown Passenger',
        routeName: booking.scheduleId || 'Unknown Route',
        departureTime: booking.travelDate,
        seatNumber: booking.seatNumber || 'N/A',
        status: booking.status || 'pending',
        amount: booking.fare || 0,
        createdAt: booking.createdAt
      }));

    // Chart Data
    const chartData = {
      // Route Status Pie Chart
      routeStatusPie: [
        { name: 'Active', value: stats.activeRoutes, color: '#10b981' },
        { name: 'Inactive', value: stats.totalRoutes - stats.activeRoutes, color: '#ef4444' }
      ],
      
      // Fleet Status Pie Chart
      fleetStatusPie: [
        { name: 'Active', value: stats.activeBuses, color: '#10b981' },
        { name: 'Maintenance', value: stats.fleetSize - stats.activeBuses, color: '#f59e0b' }
      ],
      
      // Booking Status Pie Chart
      bookingStatusPie: [
        { name: 'Confirmed', value: stats.confirmedBookings, color: '#10b981' },
        { name: 'Pending', value: stats.pendingBookings, color: '#f59e0b' }
      ],
      
      // Revenue by Month (Last 6 months)
      revenueByMonth: (() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const monthRevenue = vendorBookings
            .filter(booking => {
              const bookingDate = new Date(booking.createdAt);
              return bookingDate >= monthStart && bookingDate <= monthEnd;
            })
            .reduce((sum, booking) => sum + (booking.fare || 0), 0);
          
          months.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthRevenue
          });
        }
        return months;
      })(),
      
      // Passengers by Day (Last 7 days)
      passengersByDay: (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayPassengers = vendorBookings
            .filter(booking => {
              const bookingDate = new Date(booking.createdAt);
              return bookingDate >= dayStart && bookingDate <= dayEnd;
            }).length;
          
          days.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            passengers: dayPassengers
          });
        }
        return days;
      })(),
      
      // Trip Status Distribution
      tripStatusDistribution: (() => {
        const statusCounts = schedules.reduce((acc, schedule) => {
          const status = schedule.status || 'scheduled';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(statusCounts).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: status === 'completed' ? '#10b981' : 
                 status === 'active' ? '#3b82f6' : 
                 status === 'cancelled' ? '#ef4444' : '#f59e0b'
        }));
      })(),
      
      // Top Routes by Revenue
      topRoutesByRevenue: (() => {
        const routeRevenue = vendorBookings.reduce((acc, booking) => {
          const routeId = booking.scheduleId || 'Unknown';
          acc[routeId] = (acc[routeId] || 0) + (booking.fare || 0);
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(routeRevenue)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([routeId, revenue]) => ({
            name: routeId,
            revenue: revenue
          }));
      })(),
      
      // Average Occupancy Rate
      averageOccupancyRate: (() => {
        if (schedules.length === 0) return 0;
        const totalOccupancy = schedules.reduce((sum, schedule) => {
          const totalSeats = schedule.totalSeats || 0;
          const availableSeats = schedule.availableSeats || 0;
          const occupiedSeats = totalSeats - availableSeats;
          return sum + (totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0);
        }, 0);
        return Math.round(totalOccupancy / schedules.length);
      })(),
      
      // Payment Methods Distribution
      paymentMethodsDistribution: (() => {
        const methodCounts = vendorBookings.reduce((acc, booking) => {
          const method = booking.paymentMethod || 'cash';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(methodCounts).map(([method, count]) => ({
          name: method.charAt(0).toUpperCase() + method.slice(1),
          value: count,
          color: method === 'cash' ? '#10b981' : 
                 method === 'card' ? '#3b82f6' : 
                 method === 'mobile' ? '#8b5cf6' : '#f59e0b'
        }));
      })()
    };

    return NextResponse.json({
      success: true,
      stats,
      chartData, // Added chartData to the response
      recentTrips,
      recentBookings
    });

  } catch (error) {
    console.error('Error fetching bus dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}