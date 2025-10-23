import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { StoreProduct, StoreOrder } from '@/models/Store';
import { PharmacyMedicine } from '@/models/Pharmacy';
import { HotelRoom, HotelBooking } from '@/models/Hotel';
import { BusRoute, BusBooking } from '@/models/Bus';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch all data in parallel
    const [
      users,
      businesses,
      storeProducts,
      storeOrders,
      pharmacyMedicines,
      hotelRooms,
      hotelBookings,
      busRoutes,
      busBookings
    ] = await Promise.all([
      User.find({}).select('role createdAt').lean(),
      User.find({ role: { $in: ['manager', 'admin', 'super_admin'] } }).select('businessType createdAt').lean(),
      StoreProduct.find({}).select('name price').lean(),
      StoreOrder.find({}).select('totalAmount createdAt').lean(),
      PharmacyMedicine.find({}).select('name sellingPrice').lean(),
      HotelRoom.find({}).select('pricePerNight').lean(),
      HotelBooking.find({}).select('totalAmount createdAt').lean(),
      BusRoute.find({}).select('fare').lean(),
      BusBooking.find({}).select('totalAmount createdAt').lean()
    ]);

    // Calculate overview statistics
    const overview = {
      totalUsers: users.length,
      totalBusinesses: businesses.length,
      totalRevenue: 
        storeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) +
        hotelBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) +
        busBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
      totalOrders: storeOrders.length,
      totalProducts: storeProducts.length + pharmacyMedicines.length,
      totalBookings: hotelBookings.length + busBookings.length
    };

    // Calculate business type distribution
    const businessStats = {
      hotels: businesses.filter(b => b.businessType === 'hotel').length,
      stores: businesses.filter(b => b.businessType === 'store').length,
      pharmacies: businesses.filter(b => b.businessType === 'pharmacy').length,
      busCompanies: businesses.filter(b => b.businessType === 'bus').length
    };

    // Generate mock growth data (in real implementation, this would be calculated from actual data)
    const userGrowth = [
      { month: 'Jan', users: 120, businesses: 15 },
      { month: 'Feb', users: 145, businesses: 18 },
      { month: 'Mar', users: 167, businesses: 22 },
      { month: 'Apr', users: 189, businesses: 25 },
      { month: 'May', users: 210, businesses: 28 },
      { month: 'Jun', users: 235, businesses: 32 }
    ];

    const revenueData = [
      { month: 'Jan', revenue: 15000, orders: 45 },
      { month: 'Feb', revenue: 18500, orders: 52 },
      { month: 'Mar', revenue: 22000, orders: 61 },
      { month: 'Apr', revenue: 25800, orders: 68 },
      { month: 'May', revenue: 29500, orders: 75 },
      { month: 'Jun', revenue: 32000, orders: 82 }
    ];

    // Generate top products (mock data)
    const topProducts = [
      { name: 'Electronics Bundle', sales: 45, revenue: 12500 },
      { name: 'Health Supplements', sales: 38, revenue: 8900 },
      { name: 'Fashion Items', sales: 32, revenue: 7600 },
      { name: 'Home & Garden', sales: 28, revenue: 6200 },
      { name: 'Sports Equipment', sales: 25, revenue: 5800 }
    ];

    // Generate recent activity (mock data)
    const recentActivity = [
      {
        type: 'order',
        description: 'New order placed for Electronics Bundle',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        amount: 299.99
      },
      {
        type: 'booking',
        description: 'Hotel booking confirmed for Grand Hotel',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        amount: 150.00
      },
      {
        type: 'user',
        description: 'New user registered: John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        type: 'business',
        description: 'New business registered: TechStore Pro',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      },
      {
        type: 'order',
        description: 'Order completed for Health Supplements',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        amount: 89.99
      }
    ];

    const statistics = {
      overview,
      userGrowth,
      revenueData,
      businessStats,
      topProducts,
      recentActivity
    };

    return NextResponse.json({ 
      success: true, 
      statistics 
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
