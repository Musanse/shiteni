import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder, StoreCustomer, StoreProduct } from '@/models/Store';
import { User } from '@/models/User';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the store vendor or staff member
    let vendor = await (User as any).findOne({ 
      email: session.user.email,
      serviceType: 'store'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await (User as any).findOne({ 
        email: session.user.email,
        role: { $in: ['cashier', 'inventory_manager', 'sales_associate', 'admin'] },
        serviceType: 'store'
      });
      
      if (staff && staff.businessId) {
        // Find the actual store vendor using businessId
        vendor = await (User as any).findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing dashboard for store vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Store vendor not found' }, { status: 404 });
    }

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const weekAgo = startOfDay(subDays(new Date(), 7));

    // Fetch dashboard statistics
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      todayOrders,
      pendingOrders,
      shippedOrders,
      totalCustomers,
      weekCustomers,
      todayRevenue,
      yesterdayRevenue
    ] = await Promise.all([
      // Products
      StoreProduct.countDocuments(),
      StoreProduct.countDocuments({ status: 'active', stock: { $gt: 0 } }),
      StoreProduct.countDocuments({ status: 'active', stock: { $lte: 0 } }),
      
      // Orders
      StoreOrder.countDocuments({ createdAt: { $gte: today } }),
      StoreOrder.countDocuments({ status: 'pending' }),
      StoreOrder.countDocuments({ status: 'shipped' }),
      
      // Customers
      StoreCustomer.countDocuments(),
      StoreCustomer.countDocuments({ createdAt: { $gte: weekAgo } }),
      
      // Revenue
      StoreOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      StoreOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lt: today },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ])
    ]);

    // Fetch recent orders
    const recentOrders = await (StoreOrder as any).find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'firstName lastName email')
      .lean();

    // Fetch recent products
    const recentProducts = await (StoreProduct as any).find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate revenue growth
    const todayRevenueAmount = todayRevenue[0]?.total || 0;
    const yesterdayRevenueAmount = yesterdayRevenue[0]?.total || 0;
    const revenueGrowth = yesterdayRevenueAmount > 0 
      ? ((todayRevenueAmount - yesterdayRevenueAmount) / yesterdayRevenueAmount) * 100 
      : 0;

    // Chart data - Revenue over last 7 days
    const revenueChartData = await (StoreOrder as any).aggregate([
      {
        $match: {
          createdAt: { $gte: subDays(new Date(), 7) },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Chart data - Orders by status
    const ordersByStatus = await (StoreOrder as any).aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Chart data - Top selling products (last 30 days)
    const topProducts = await (StoreOrder as any).aggregate([
      {
        $match: {
          createdAt: { $gte: subDays(new Date(), 30) },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'storeproducts',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Chart data - Customer acquisition over time
    const customerAcquisition = await (StoreCustomer as any).aggregate([
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
      },
      { $limit: 30 }
    ]);

    const dashboardData = {
      stats: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        todayOrders,
        pendingOrders,
        shippedOrders,
        totalCustomers,
        weekCustomers,
        todayRevenue: todayRevenueAmount,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10
      },
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerId ? 
          `${order.customerId.firstName} ${order.customerId.lastName}` : 
          order.shippingAddress?.name || 'Unknown',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      })),
      recentProducts: recentProducts.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        status: product.status,
        createdAt: product.createdAt
      })),
      charts: {
        revenueChart: revenueChartData || [],
        ordersByStatus: ordersByStatus || [],
        topProducts: topProducts || [],
        customerAcquisition: customerAcquisition || []
      }
    };

    console.log('Dashboard data prepared:', JSON.stringify(dashboardData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      data: dashboardData 
    });
  } catch (error) {
    console.error('Error fetching store dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
