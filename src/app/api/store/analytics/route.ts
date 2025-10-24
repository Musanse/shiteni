import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder, StoreCustomer, StoreProduct } from '@/models/Store';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a store vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'store') {
      return NextResponse.json({ error: 'Access denied. Store vendors only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    // Fetch basic metrics
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      ordersInPeriod,
      customersInPeriod,
      productsInPeriod
    ] = await Promise.all([
      StoreOrder.countDocuments(),
      StoreCustomer.countDocuments(),
      StoreProduct.countDocuments({ status: 'active' }),
      StoreOrder.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      StoreCustomer.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      StoreProduct.countDocuments({
        status: 'active',
        createdAt: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Calculate revenue metrics
    const revenueResult = await (StoreOrder as any).aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const averageOrderValue = revenueResult[0]?.averageOrderValue || 0;
    const orderCount = revenueResult[0]?.orderCount || 0;

    // Generate daily revenue data
    const dailyRevenueData = await (StoreOrder as any).aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Generate date labels and fill missing days
    const dateLabels = eachDayOfInterval({ start: startDate, end: endDate });
    const revenueChartData = {
      labels: dateLabels.map(date => format(date, 'MMM dd')),
      datasets: [{
        label: 'Revenue (ZMW)',
        data: dateLabels.map(date => {
          const dayData = dailyRevenueData.find(d => 
            d._id.year === date.getFullYear() &&
            d._id.month === date.getMonth() + 1 &&
            d._id.day === date.getDate()
          );
          return dayData ? dayData.revenue : 0;
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    const ordersChartData = {
      labels: dateLabels.map(date => format(date, 'MMM dd')),
      datasets: [{
        label: 'Orders',
        data: dateLabels.map(date => {
          const dayData = dailyRevenueData.find(d => 
            d._id.year === date.getFullYear() &&
            d._id.month === date.getMonth() + 1 &&
            d._id.day === date.getDate()
          );
          return dayData ? dayData.orders : 0;
        }),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }]
    };

    // Get top products by sales
    const topProductsResult = await (StoreOrder as any).aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    const topProductsData = {
      labels: topProductsResult.map(p => p._id),
      datasets: [{
        label: 'Sales',
        data: topProductsResult.map(p => p.totalQuantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 1
      }]
    };

    // Get customer segments
    const customerSegmentsResult = await (StoreCustomer as any).aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$totalOrders', 5] },
              'VIP Customers',
              {
                $cond: [
                  { $gte: ['$totalOrders', 2] },
                  'Returning Customers',
                  'New Customers'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const customerSegmentsData = {
      labels: ['New Customers', 'Returning Customers', 'VIP Customers'],
      datasets: [{
        data: [
          customerSegmentsResult.find(s => s._id === 'New Customers')?.count || 0,
          customerSegmentsResult.find(s => s._id === 'Returning Customers')?.count || 0,
          customerSegmentsResult.find(s => s._id === 'VIP Customers')?.count || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)'
        ],
        borderWidth: 1
      }]
    };

    // Calculate conversion rate (simplified)
    const conversionRate = totalCustomers > 0 ? (totalCustomers / (totalCustomers * 3.2)) * 100 : 0;

    const analyticsData = {
      totalRevenue,
      totalOrders: orderCount,
      totalCustomers: customersInPeriod,
      totalProducts: productsInPeriod,
      averageOrderValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      revenueChartData,
      ordersChartData,
      topProductsData,
      customerSegmentsData
    };

    return NextResponse.json({ 
      success: true, 
      data: analyticsData 
    });
  } catch (error) {
    console.error('Error fetching store analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
