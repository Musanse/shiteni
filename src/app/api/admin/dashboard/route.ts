import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Access models through mongoose.models
    const User = mongoose.models.User;
    const StoreProduct = mongoose.models.StoreProduct;
    const StoreOrder = mongoose.models.StoreOrder;
    const PharmacyMedicine = mongoose.models.PharmacyMedicine;
    const HotelRoom = mongoose.models.HotelRoom;
    const HotelBooking = mongoose.models.HotelBooking;
    const BusRoute = mongoose.models.BusRoute;
    const BusBooking = mongoose.models.BusBooking;

    // Verify all models are available
    const models = {
      User, StoreProduct, StoreOrder, PharmacyMedicine,
      HotelRoom, HotelBooking, BusRoute, BusBooking
    };

    for (const [name, model] of Object.entries(models)) {
      if (!model) {
        console.error(`❌ Model ${name} not found`);
        throw new Error(`Model ${name} not found`);
      }
    }

    // Fetch all data in parallel
    const [
      users,
      storeProducts,
      storeOrders,
      pharmacyMedicines,
      hotelRooms,
      hotelBookings,
      busRoutes,
      busBookings
    ] = await Promise.all([
      User.find({}).select('firstName lastName email role kycStatus createdAt').lean(),
      StoreProduct.find({}).select('name price stock category').lean(),
      StoreOrder.find({}).select('totalAmount status').lean(),
      PharmacyMedicine.find({}).select('name sellingPrice stock').lean(),
      HotelRoom.find({}).select('roomNumber pricePerNight status').lean(),
      HotelBooking.find({}).select('totalAmount status').lean(),
      BusRoute.find({}).select('routeName fare status').lean(),
      BusBooking.find({}).select('totalAmount status').lean()
    ]);

    // Calculate business statistics
    const businessStats = {
      total: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role)).length,
      active: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role) && user.kycStatus === 'verified').length,
      pending: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role) && user.kycStatus === 'pending').length,
      suspended: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role) && user.kycStatus === 'suspended').length,
      verified: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role) && user.kycStatus === 'verified').length,
    };

    // Calculate user statistics
    const userStats = {
      total: users.length,
      customers: users.filter(user => user.role === 'customer').length,
      businessAdmins: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role)).length,
      staff: users.filter(user => ['receptionist', 'housekeeping', 'cashier', 'inventory_manager', 'sales_associate', 'pharmacist', 'technician', 'driver', 'conductor', 'dispatcher'].includes(user.role)).length,
      verified: users.filter(user => user.kycStatus === 'verified').length,
      pendingKyc: users.filter(user => user.kycStatus === 'pending').length,
    };

    // Calculate e-commerce statistics
    const ecommerceStats = {
      totalProducts: storeProducts.length,
      totalOrders: storeOrders.length,
      totalRevenue: storeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      pendingOrders: storeOrders.filter(order => order.status === 'pending').length,
      completedOrders: storeOrders.filter(order => order.status === 'completed').length,
      activeProducts: storeProducts.filter(product => product.stock > 0).length,
      lowStockProducts: storeProducts.filter(product => product.stock < 10).length,
    };

    // Calculate multi-vending platform statistics
    const platformStats = {
      totalBusinesses: businessStats.total,
      activeBusinesses: businessStats.active,
      totalProducts: storeProducts.length + pharmacyMedicines.length,
      totalRooms: hotelRooms.length,
      totalRoutes: busRoutes.length,
      totalBookings: hotelBookings.length + busBookings.length,
      totalRevenue: ecommerceStats.totalRevenue + 
                   hotelBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) +
                   busBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
    };

    // Get recent businesses (last 5)
    const recentBusinesses = users
      .filter(user => ['manager', 'admin', 'super_admin'].includes(user.role))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        status: user.kycStatus,
        createdAt: user.createdAt,
      }));

    // Get recent users (last 5)
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      }));

    // Calculate system health metrics
    const systemHealth = {
      uptime: '99.9%', // This would be calculated from actual uptime
      responseTime: '120ms', // This would be measured
      activeUsers: userStats.total,
      totalTransactions: platformStats.totalBookings + ecommerceStats.totalOrders,
      databaseStatus: 'healthy',
      apiStatus: 'operational',
      lastBackup: new Date().toISOString(),
      version: '1.0.0',
    };

    // Calculate growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrowth = {
      newUsers: users.filter(user => new Date(user.createdAt) >= thirtyDaysAgo).length,
      newBusinesses: users.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role) && new Date(user.createdAt) >= thirtyDaysAgo).length,
      newProducts: storeProducts.filter(product => new Date(product.createdAt || new Date()) >= thirtyDaysAgo).length,
    };

    // Chart data - User registration trends (last 30 days)
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: subDays(new Date(), 30) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Chart data - Business types distribution
    const businessTypesDistribution = await User.aggregate([
      {
        $match: {
          role: { $in: ['manager', 'admin', 'super_admin'] }
        }
      },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Chart data - Revenue by service type (last 30 days)
    const revenueByService = await Promise.all([
      // Store revenue
      StoreOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: subDays(new Date(), 30) },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: 'store',
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        }
      ]),
      // Hotel revenue
      HotelBooking.aggregate([
        {
          $match: {
            createdAt: { $gte: subDays(new Date(), 30) },
            status: { $in: ['confirmed', 'checked_in', 'completed'] }
          }
        },
        {
          $group: {
            _id: 'hotel',
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        }
      ]),
      // Bus revenue
      BusBooking.aggregate([
        {
          $match: {
            createdAt: { $gte: subDays(new Date(), 30) },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: 'bus',
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        }
      ])
    ]);

    // Chart data - Order status distribution
    const orderStatusDistribution = await Promise.all([
      StoreOrder.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      HotelBooking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      BusBooking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Chart data - Platform growth metrics
    const platformGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          users: { $sum: 1 },
          businesses: {
            $sum: {
              $cond: [
                { $in: ['$role', ['manager', 'admin', 'super_admin']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      { $limit: 30 }
    ]);

    const dashboardData = {
      businessStats,
      userStats,
      ecommerceStats,
      platformStats,
      systemHealth,
      recentGrowth,
      recentBusinesses,
      recentUsers,
      lastUpdated: new Date().toISOString(),
      charts: {
        userRegistrationTrend: userRegistrationTrend || [],
        businessTypesDistribution: businessTypesDistribution || [],
        revenueByService: revenueByService.flat() || [],
        orderStatusDistribution: orderStatusDistribution.flat() || [],
        platformGrowth: platformGrowth || []
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
