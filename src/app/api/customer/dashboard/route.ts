import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { StoreOrder } from '@/models/Store';
import PharmacyOrder from '@/models/PharmacyOrder';
import { BusBooking } from '@/models/Bus';
import { HotelBooking } from '@/models/Hotel';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    
    // Get user details
    const user = await (User as any).findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch recent orders from different services
    const [storeOrders, pharmacyOrders, busBookings, hotelBookings] = await Promise.all([
      // Store orders
      (StoreOrder as any).find({ customerId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Pharmacy orders
      (PharmacyOrder as any).find({ 
        $or: [
          { customerId: new mongoose.Types.ObjectId(userId) },
          { customerId: userId },
          { customerEmail: user.email }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Bus bookings
      (BusBooking as any).find({ 
        $or: [
          { customerId: userId },
          { customerEmail: user.email }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Hotel bookings
      (HotelBooking as any).find({ 
        $or: [
          { customerId: userId },
          { customerEmail: user.email }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Calculate statistics
    const totalStoreOrders = await (StoreOrder as any).countDocuments({ customerId: userId });
    const totalPharmacyOrders = await (PharmacyOrder as any).countDocuments({ 
      $or: [
        { customerId: new mongoose.Types.ObjectId(userId) },
        { customerId: userId },
        { customerEmail: user.email }
      ]
    });
    const totalBusBookings = await (BusBooking as any).countDocuments({ 
      $or: [
        { customerId: userId },
        { customerEmail: user.email }
      ]
    });
    const totalHotelBookings = await (HotelBooking as any).countDocuments({ 
      $or: [
        { customerId: userId },
        { customerEmail: user.email }
      ]
    });

    // Calculate total spending
    const storeSpending = storeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pharmacySpending = pharmacyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const busSpending = busBookings.reduce((sum, booking) => sum + (booking.fareAmount || 0), 0);
    const hotelSpending = hotelBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Recent activity
    const recentActivity = [
      ...storeOrders.map(order => ({
        id: order._id,
        type: 'store_order',
        title: `Store Order #${order.orderNumber}`,
        description: `${order.items?.length || 0} items`,
        amount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        vendor: order.vendorName || 'Store'
      })),
      ...pharmacyOrders.map(order => ({
        id: order._id,
        type: 'pharmacy_order',
        title: `Pharmacy Order #${order.orderNumber}`,
        description: `${order.items?.length || 0} medicines`,
        amount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        vendor: order.vendorName || 'Pharmacy'
      })),
      ...busBookings.map(booking => ({
        id: booking._id,
        type: 'bus_booking',
        title: `Bus Booking #${booking.bookingNumber}`,
        description: `${booking.routeName} - ${booking.tripName}`,
        amount: booking.fareAmount,
        status: booking.paymentStatus,
        date: booking.createdAt,
        vendor: booking.busName || 'Bus Service'
      })),
      ...hotelBookings.map(booking => ({
        id: booking._id,
        type: 'hotel_booking',
        title: `Hotel Booking #${booking.bookingNumber}`,
        description: `${booking.hotelName} - ${booking.roomType}`,
        amount: booking.totalAmount,
        status: booking.status,
        date: booking.createdAt,
        vendor: booking.hotelName || 'Hotel'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    const dashboardData = {
      overview: {
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        totalOrders: totalStoreOrders + totalPharmacyOrders,
        totalBookings: totalBusBookings + totalHotelBookings,
        totalSpending: storeSpending + pharmacySpending + busSpending + hotelSpending,
        memberSince: user.createdAt
      },
      statistics: {
        storeOrders: {
          total: totalStoreOrders,
          spending: storeSpending,
          recent: storeOrders.length
        },
        pharmacyOrders: {
          total: totalPharmacyOrders,
          spending: pharmacySpending,
          recent: pharmacyOrders.length
        },
        busBookings: {
          total: totalBusBookings,
          spending: busSpending,
          recent: busBookings.length
        },
        hotelBookings: {
          total: totalHotelBookings,
          spending: hotelSpending,
          recent: hotelBookings.length
        }
      },
      recentActivity,
      quickActions: [
        {
          title: 'Browse Stores',
          description: 'Shop from local stores',
          href: '/store',
          icon: 'store'
        },
        {
          title: 'Find Pharmacy',
          description: 'Order medicines online',
          href: '/pharmacy',
          icon: 'pharmacy'
        },
        {
          title: 'Book Bus',
          description: 'Find bus routes',
          href: '/bus',
          icon: 'bus'
        },
        {
          title: 'Find Hotels',
          description: 'Book accommodation',
          href: '/hotel',
          icon: 'hotel'
        }
      ]
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
