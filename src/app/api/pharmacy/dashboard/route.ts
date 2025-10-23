import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import PharmacyOrder from '@/models/PharmacyOrder';
import { User } from '@/models/User';
import { PHARMACY_PERMISSIONS } from '@/lib/pharmacy-rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !PHARMACY_PERMISSIONS.ORDER_MANAGEMENT.includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    const pharmacyId = session.user.id;

    // Get medicine statistics
    const totalMedicines = await Medicine.countDocuments({ pharmacyId });
    const activeMedicines = await Medicine.countDocuments({ 
      pharmacyId, 
      status: 'active',
      stock: { $gt: 10 }
    });
    const lowStockMedicines = await Medicine.countDocuments({ 
      pharmacyId, 
      stock: { $lte: 10, $gt: 0 }
    });
    const expiredMedicines = await Medicine.countDocuments({ 
      pharmacyId, 
      expiryDate: { $lt: new Date() }
    });

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get prescription/order statistics
    const todayOrders = await PharmacyOrder.countDocuments({ 
      pharmacyId, 
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    const pendingOrders = await PharmacyOrder.countDocuments({ 
      pharmacyId, 
      status: 'pending'
    });
    const confirmedOrders = await PharmacyOrder.countDocuments({ 
      pharmacyId, 
      status: 'confirmed'
    });

    // Get patient statistics
    const totalPatients = await User.countDocuments({ 
      serviceType: 'pharmacy',
      role: 'customer'
    });

    // Get patients from this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekPatients = await User.countDocuments({ 
      serviceType: 'pharmacy',
      role: 'customer',
      createdAt: { $gte: weekAgo }
    });

    // Calculate today's revenue
    const todayRevenueOrders = await PharmacyOrder.find({
      pharmacyId,
      status: 'confirmed',
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).select('totalAmount');

    const todayRevenue = todayRevenueOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate yesterday's revenue for growth comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    const yesterdayRevenueOrders = await PharmacyOrder.find({
      pharmacyId,
      status: 'confirmed',
      createdAt: { $gte: startOfYesterday, $lt: endOfYesterday }
    }).select('totalAmount');

    const yesterdayRevenue = yesterdayRevenueOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Get recent prescriptions/orders
    const recentOrders = await PharmacyOrder.find({ pharmacyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'firstName lastName')
      .lean();

    // Get recent medicines
    const recentMedicines = await Medicine.find({ pharmacyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Chart Data Calculations
    // 1. Medicine Status Distribution (Pie Chart)
    const medicineStatusData = {
      labels: ['Active', 'Low Stock', 'Expired', 'Out of Stock'],
      data: [
        activeMedicines,
        lowStockMedicines,
        expiredMedicines,
        await Medicine.countDocuments({ pharmacyId, stock: 0 })
      ],
      colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280']
    };

    // 2. Prescription Status Distribution (Pie Chart)
    const prescriptionStatusData = {
      labels: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      data: [
        await PharmacyOrder.countDocuments({ pharmacyId, status: 'pending' }),
        await PharmacyOrder.countDocuments({ pharmacyId, status: 'confirmed' }),
        await PharmacyOrder.countDocuments({ pharmacyId, status: 'cancelled' }),
        await PharmacyOrder.countDocuments({ pharmacyId, status: 'completed' })
      ],
      colors: ['#f59e0b', '#3b82f6', '#ef4444', '#10b981']
    };

    // 3. Revenue Trend (Last 7 Days) - Bar Chart
    const revenueTrendData = {
      labels: [],
      data: [],
      colors: ['#3b82f6']
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayOrders = await PharmacyOrder.find({
        pharmacyId,
        status: 'confirmed',
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }).select('totalAmount');

      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      revenueTrendData.labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      revenueTrendData.data.push(dayRevenue);
    }

    // 4. Medicine Categories Distribution (Pie Chart)
    const medicineCategories = await Medicine.aggregate([
      { $match: { pharmacyId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const medicineCategoryData = {
      labels: medicineCategories.map(cat => cat._id || 'Uncategorized'),
      data: medicineCategories.map(cat => cat.count),
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    };

    // 5. Monthly Prescription Trends (Line Chart)
    const monthlyPrescriptionData = {
      labels: [],
      data: [],
      colors: ['#10b981']
    };

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const monthOrders = await PharmacyOrder.countDocuments({
        pharmacyId,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      });
      
      monthlyPrescriptionData.labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      monthlyPrescriptionData.data.push(monthOrders);
    }

    // 6. Top Selling Medicines (Bar Chart)
    const topSellingMedicines = await Medicine.aggregate([
      { $match: { pharmacyId } },
      { $lookup: {
          from: 'pharmacyorders',
          localField: '_id',
          foreignField: 'medicines.medicineId',
          as: 'orders'
        }
      },
      { $addFields: {
          totalSold: { $sum: '$orders.medicines.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $project: { name: 1, totalSold: 1 } }
    ]);

    const topSellingData = {
      labels: topSellingMedicines.map(med => med.name),
      data: topSellingMedicines.map(med => med.totalSold || 0),
      colors: ['#3b82f6']
    };

    const dashboardData = {
      stats: {
        totalMedicines,
        activeMedicines,
        lowStockMedicines,
        expiredMedicines,
        todayPrescriptions: todayOrders,
        pendingPrescriptions: pendingOrders,
        dispensedPrescriptions: confirmedOrders,
        totalPatients,
        weekPatients,
        todayRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      charts: {
        medicineStatus: medicineStatusData,
        prescriptionStatus: prescriptionStatusData,
        revenueTrend: revenueTrendData,
        medicineCategories: medicineCategoryData,
        monthlyPrescriptions: monthlyPrescriptionData,
        topSellingMedicines: topSellingData
      },
      recentPrescriptions: recentOrders.map(order => ({
        _id: order._id.toString(),
        prescriptionNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
        patientName: order.customerId ? 
          `${(order.customerId as any).firstName} ${(order.customerId as any).lastName}` : 
          'Unknown Patient',
        status: order.status,
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt
      })),
      recentMedicines: recentMedicines.map(medicine => ({
        _id: medicine._id.toString(),
        name: medicine.name,
        stock: medicine.stock,
        status: medicine.stock <= 10 ? 'low_stock' : 
                medicine.expiryDate && new Date(medicine.expiryDate) < new Date() ? 'expired_medicine' : 
                'active',
        createdAt: medicine.createdAt
      }))
    };

    return NextResponse.json({ 
      success: true, 
      data: dashboardData 
    });
  } catch (error) {
    console.error('Error fetching pharmacy dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}