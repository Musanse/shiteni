import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PharmacyOrder from '@/models/PharmacyOrder';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the pharmacy vendor or staff member
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'pharmacy'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['pharmacist', 'technician', 'cashier', 'manager', 'admin'] },
        serviceType: 'pharmacy'
      });
      
      if (staff && staff.institutionId) {
        // Find the actual pharmacy vendor using institutionId
        vendor = await User.findById(staff.institutionId);
        console.log(`Staff member ${staff.email} accessing customers for pharmacy vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Pharmacy vendor not found' }, { status: 404 });
    }

    // Debug: Log session info
    console.log('🔍 Debug - Session user:', {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as any).role,
      serviceType: (session.user as any).serviceType,
      vendorId: vendor._id
    });

    // Debug: Check total orders
    const totalOrders = await PharmacyOrder.countDocuments();
    const ordersForUser = await PharmacyOrder.countDocuments({ pharmacyId: vendor._id });
    console.log('🔍 Debug - Orders:', { totalOrders, ordersForUser });

    // If no orders for this user, try to find any pharmacy orders
    if (ordersForUser === 0) {
      console.log('⚠️ No orders found for current user, checking all pharmacy orders...');
      const allPharmacyOrders = await PharmacyOrder.find().limit(5).select('pharmacyId customerName orderNumber status').lean();
      console.log('📋 Sample orders:', allPharmacyOrders);
    }


    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build aggregation pipeline to get unique customers
    // Filter by vendor's pharmacyId
    const matchCondition = { pharmacyId: vendor._id };
    
    const pipeline: any[] = [
      {
        $match: {
          ...matchCondition,
          // Only include confirmed orders and higher (confirmed, processing, ready, completed)
          status: { $in: ['confirmed', 'processing', 'ready', 'completed'] },
          ...(search && {
            $or: [
              { customerName: { $regex: search, $options: 'i' } },
              { customerEmail: { $regex: search, $options: 'i' } },
              { customerPhone: { $regex: search, $options: 'i' } }
            ]
          })
        }
      },
      {
        $group: {
          _id: {
            customerId: '$customerId',
            customerName: '$customerName',
            customerEmail: '$customerEmail',
            customerPhone: '$customerPhone',
            customerAddress: '$customerAddress'
          },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          firstOrderDate: { $min: '$orderDate' },
          lastOrderDate: { $max: '$orderDate' },
          orderTypes: { $addToSet: '$orderType' },
          paymentMethods: { $addToSet: '$paymentMethod' },
          orderNumbers: { $push: '$orderNumber' },
          orderStatuses: { $addToSet: '$status' }
        }
      },
      {
        $project: {
          _id: 1,
          customerId: '$_id.customerId',
          customerName: '$_id.customerName',
          customerEmail: '$_id.customerEmail',
          customerPhone: '$_id.customerPhone',
          customerAddress: '$_id.customerAddress',
          totalOrders: 1,
          totalSpent: 1,
          firstOrderDate: 1,
          lastOrderDate: 1,
          orderTypes: 1,
          paymentMethods: 1,
          orderNumbers: 1,
          orderStatuses: 1,
          status: {
            $cond: {
              if: { $gte: ['$lastOrderDate', { $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000] }] },
              then: 'active',
              else: 'inactive'
            }
          }
        }
      },
      {
        $sort: { lastOrderDate: -1 }
      }
    ];

    // Add status filter if provided
    if (status && status !== 'all') {
      pipeline.push({
        $match: { status: status }
      });
    }

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await PharmacyOrder.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    const customers = await PharmacyOrder.aggregate(pipeline);
    console.log('🔍 Debug - Aggregated customers:', customers.length);
    console.log('🔍 Debug - Pipeline match condition:', matchCondition);
    console.log('🔍 Debug - Customers found:', customers.map(c => ({ name: c.customerName, orders: c.totalOrders, statuses: c.orderStatuses })));

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      debug: {
        sessionUser: {
          id: session.user.id,
          email: session.user.email,
          role: (session.user as any).role,
          serviceType: (session.user as any).serviceType
        },
        totalOrders,
        ordersForUser,
        customersFound: customers.length,
        matchCondition: matchCondition,
        showingAllOrders: ordersForUser === 0,
        statusFilter: 'confirmed+ (confirmed, processing, ready, completed)'
      }
    });

  } catch (error) {
    console.error('Error fetching pharmacy customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}