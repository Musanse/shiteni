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

    // Calculate user growth data from actual data
    const userGrowth = [];
    const revenueData = [];
    
    // Generate monthly data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthUsers = users.filter(user => 
        user.createdAt >= monthStart && user.createdAt <= monthEnd
      ).length;
      
      const monthBusinesses = businesses.filter(business => 
        business.createdAt >= monthStart && business.createdAt <= monthEnd
      ).length;
      
      const monthOrders = storeOrders.filter(order => 
        order.createdAt >= monthStart && order.createdAt <= monthEnd
      );
      
      const monthBookings = [
        ...hotelBookings.filter(booking => 
          booking.createdAt >= monthStart && booking.createdAt <= monthEnd
        ),
        ...busBookings.filter(booking => 
          booking.createdAt >= monthStart && booking.createdAt <= monthEnd
        )
      ];
      
      const monthRevenue = 
        monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) +
        monthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      userGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        users: monthUsers,
        businesses: monthBusinesses
      });
      
      revenueData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        orders: monthOrders.length + monthBookings.length
      });
    }

    // Calculate top products from actual data
    const productSales = new Map();
    
    // Count store product sales
    storeOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown Product';
          if (!productSales.has(productName)) {
            productSales.set(productName, { sales: 0, revenue: 0 });
          }
          const current = productSales.get(productName);
          current.sales += item.quantity || 1;
          current.revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Generate recent activity from actual data
    const recentActivity = [];
    
    // Add recent orders
    const recentOrders = storeOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentOrders.forEach(order => {
      recentActivity.push({
        type: 'order',
        description: `New order placed - Total: ZMW ${order.totalAmount || 0}`,
        timestamp: order.createdAt,
        amount: order.totalAmount || 0
      });
    });
    
    // Add recent bookings
    const recentBookings = [
      ...hotelBookings,
      ...busBookings
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 2);
    
    recentBookings.forEach(booking => {
      recentActivity.push({
        type: 'booking',
        description: `New booking confirmed - Amount: ZMW ${booking.totalAmount || 0}`,
        timestamp: booking.createdAt,
        amount: booking.totalAmount || 0
      });
    });
    
    // Add recent users
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentUsers.forEach(user => {
      recentActivity.push({
        type: 'user',
        description: `New ${user.role} registered`,
        timestamp: user.createdAt
      });
    });
    
    // Sort by timestamp and take most recent
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalRecentActivity = recentActivity.slice(0, 5);

    const statistics = {
      overview,
      userGrowth,
      revenueData,
      businessStats,
      topProducts,
      recentActivity: finalRecentActivity
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
