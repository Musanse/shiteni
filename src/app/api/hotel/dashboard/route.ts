import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as HotelModule from '@/models/Hotel';
import { User } from '@/models/User';
const { HotelRoom, HotelBooking, HotelGuest } = HotelModule;

export async function GET(request: NextRequest) {
  try {
    console.log('🏨 Hotel dashboard API called');
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the hotel vendor or staff member
    console.log('🔍 Looking for vendor with email:', session.user.email);
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    console.log('🏢 Vendor found:', vendor ? 'Yes' : 'No');

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      console.log('🔍 Looking for staff member with email:', session.user.email);
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      console.log('👤 Staff found:', staff ? 'Yes' : 'No');
      
      if (staff && staff.institutionId) {
        // Find the actual hotel vendor using institutionId
        vendor = await User.findById(staff.institutionId);
        console.log(`Staff member ${staff.email} accessing dashboard for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      console.log('❌ No vendor found for user:', session.user.email);
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    console.log('✅ Using vendor:', vendor.email);

    const userId = vendor._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all hotel-related data for this vendor
    const [
      rooms,
      bookings,
      guests
    ] = await Promise.all([
      // Get all rooms (we'll add hotelId filtering later)
      HotelRoom.find({}).lean(),
      // Get all bookings
      HotelBooking.find({}).lean(),
      // Get all guests
      HotelGuest.find({}).lean()
    ]);

    // Calculate statistics
    const stats = {
      // Rooms
      totalRooms: rooms.length,
      availableRooms: rooms.filter(room => room.status === 'available').length,
      occupiedRooms: rooms.filter(room => room.status === 'occupied').length,
      maintenanceRooms: rooms.filter(room => room.status === 'maintenance').length,
      
      // Bookings
      totalBookings: bookings.length,
      todayBookings: bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= today && bookingDate < tomorrow;
      }).length,
      pendingBookings: bookings.filter(booking => booking.status === 'pending').length,
      confirmedBookings: bookings.filter(booking => booking.status === 'confirmed').length,
      checkedInBookings: bookings.filter(booking => booking.status === 'checked_in').length,
      checkedOutBookings: bookings.filter(booking => booking.status === 'checked_out').length,
      
      // Guests
      totalGuests: guests.length,
      currentGuests: bookings.filter(booking => booking.status === 'checked_in').length,
      
      // Revenue
      totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
      todayRevenue: bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= today && bookingDate < tomorrow;
      }).reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
      paidRevenue: bookings.filter(booking => booking.paymentStatus === 'paid').reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    };

    // Chart Data
    const chartData = {
      // Room Status Pie Chart
      roomStatusPie: [
        { name: 'Available', value: stats.availableRooms, color: '#10b981' },
        { name: 'Occupied', value: stats.occupiedRooms, color: '#f59e0b' },
        { name: 'Maintenance', value: stats.maintenanceRooms, color: '#ef4444' }
      ],

      // Booking Status Pie Chart
      bookingStatusPie: [
        { name: 'Pending', value: stats.pendingBookings, color: '#6b7280' },
        { name: 'Confirmed', value: stats.confirmedBookings, color: '#3b82f6' },
        { name: 'Checked In', value: stats.checkedInBookings, color: '#10b981' },
        { name: 'Checked Out', value: stats.checkedOutBookings, color: '#8b5cf6' }
      ],

      // Revenue by Month (Last 6 months)
      revenueByMonth: (() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const monthRevenue = bookings
            .filter(booking => {
              const bookingDate = new Date(booking.createdAt);
              return bookingDate >= monthStart && bookingDate <= monthEnd;
            })
            .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
          
          months.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthRevenue
          });
        }
        return months;
      })(),

      // Bookings by Day (Last 7 days)
      bookingsByDay: (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.createdAt);
            return bookingDate >= dayStart && bookingDate <= dayEnd;
          }).length;
          
          days.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            bookings: dayBookings
          });
        }
        return days;
      })(),

      // Room Type Distribution
      roomTypeDistribution: (() => {
        const roomTypes = {};
        rooms.forEach(room => {
          const type = room.roomType || 'Standard';
          roomTypes[type] = (roomTypes[type] || 0) + 1;
        });
        return Object.entries(roomTypes).map(([type, count]) => ({
          name: type,
          value: count,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }));
      })(),

      // Occupancy Rate by Month
      occupancyRateByMonth: (() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const monthBookings = bookings.filter(booking => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            return (checkIn <= monthEnd && checkOut >= monthStart);
          });
          
          const totalRoomDays = stats.totalRooms * monthEnd.getDate();
          const occupiedRoomDays = monthBookings.reduce((sum, booking) => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const daysInMonth = Math.min(checkOut.getTime(), monthEnd.getTime()) - Math.max(checkIn.getTime(), monthStart.getTime());
            return sum + Math.max(0, Math.ceil(daysInMonth / (1000 * 60 * 60 * 24)));
          }, 0);
          
          const occupancyRate = totalRoomDays > 0 ? (occupiedRoomDays / totalRoomDays) * 100 : 0;
          
          months.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            occupancyRate: Math.round(occupancyRate)
          });
        }
        return months;
      })(),

      // Average Stay Duration
      averageStayDuration: (() => {
        const completedBookings = bookings.filter(booking => booking.status === 'checked_out');
        if (completedBookings.length === 0) return 0;
        
        const totalDays = completedBookings.reduce((sum, booking) => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const diffTime = checkOut.getTime() - checkIn.getTime();
          return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }, 0);
        
        return Math.round(totalDays / completedBookings.length);
      })(),

      // Revenue by Payment Method
      revenueByPaymentMethod: (() => {
        const paymentMethods = {};
        bookings.forEach(booking => {
          const method = booking.paymentMethod || 'Cash';
          paymentMethods[method] = (paymentMethods[method] || 0) + (booking.totalAmount || 0);
        });
        return Object.entries(paymentMethods).map(([method, amount]) => ({
          name: method,
          value: amount,
          color: method === 'Card' ? '#3b82f6' : method === 'Cash' ? '#10b981' : '#f59e0b'
        }));
      })()
    };

    // Get recent bookings (last 5)
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(booking => ({
        _id: booking._id,
        guestName: booking.guestName,
        roomNumber: booking.roomId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt
      }));

    // Get recent activities (check-ins, check-outs, new bookings)
    const recentActivities = [];
    
    // Add check-ins
    const checkIns = bookings
      .filter(booking => booking.status === 'checked_in')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(booking => ({
        type: 'check-in',
        message: `Room ${booking.roomId} checked in`,
        details: `Guest: ${booking.guestName} • ${new Date(booking.createdAt).toLocaleTimeString()}`,
        status: 'success',
        createdAt: booking.createdAt
      }));

    // Add check-outs
    const checkOuts = bookings
      .filter(booking => booking.status === 'checked_out')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(booking => ({
        type: 'check-out',
        message: `Room ${booking.roomId} checked out`,
        details: `Guest: ${booking.guestName} • ${new Date(booking.createdAt).toLocaleTimeString()}`,
        status: 'warning',
        createdAt: booking.createdAt
      }));

    // Add new bookings
    const newBookings = bookings
      .filter(booking => booking.status === 'pending' || booking.status === 'confirmed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(booking => ({
        type: 'booking',
        message: `New booking received`,
        details: `Room ${booking.roomId} • Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}`,
        status: 'info',
        createdAt: booking.createdAt
      }));

    // Combine and sort all activities
    recentActivities.push(...checkIns, ...checkOuts, ...newBookings);
    recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    recentActivities.splice(5); // Keep only last 5 activities

    return NextResponse.json({
      success: true,
      stats,
      chartData,
      recentBookings,
      recentActivities
    });

  } catch (error) {
    console.error('Error fetching hotel dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
