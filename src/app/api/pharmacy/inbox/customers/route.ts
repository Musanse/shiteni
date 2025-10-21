import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
// Dynamic import to avoid build issues

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
        console.log(`Staff member ${staff.email} accessing inbox customers for pharmacy vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Pharmacy vendor not found' }, { status: 404 });
    }

    // Dynamic import to avoid build issues
    const { default: PharmacyOrder } = await import('@/models/PharmacyOrder');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const orderType = searchParams.get('orderType') || 'online';

    // Build aggregation pipeline to get unique customers from pharmacy orders
    const pipeline: any[] = [
      {
        $match: {
          pharmacyId: vendor._id,
          orderType: orderType, // Only online orders for chat
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
            customerEmail: '$customerEmail',
            customerPhone: '$customerPhone'
          },
          customerName: { $first: '$customerName' },
          customerEmail: { $first: '$customerEmail' },
          customerPhone: { $first: '$customerPhone' },
          customerAddress: { $first: '$customerAddress' },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: '$orderDate' },
          totalSpent: { $sum: '$totalAmount' },
          orderNumbers: { $push: '$orderNumber' },
          orderStatuses: { $push: '$status' },
          paymentMethods: { $addToSet: '$paymentMethod' }
        }
      },
      {
        $project: {
          _id: 1,
          customerId: '$_id.customerId',
          customerName: 1,
          customerEmail: 1,
          customerPhone: 1,
          customerAddress: 1,
          totalOrders: 1,
          lastOrderDate: 1,
          totalSpent: 1,
          orderNumbers: 1,
          orderStatuses: 1,
          paymentMethods: 1,
          // Create conversation ID for chat
          conversationId: {
            $concat: ['pharmacy_', { $toString: '$_id.customerId' || 'guest' }, '_', { $toString: '$customerEmail' || '$customerPhone' }]
          },
          // Determine if customer is active (has recent orders)
          isActive: {
            $gte: ['$lastOrderDate', { $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000] }] // 30 days
          }
        }
      },
      {
        $sort: { lastOrderDate: -1 }
      }
    ];

    const customers = await PharmacyOrder.aggregate(pipeline);

    return NextResponse.json({ 
      success: true, 
      customers,
      debug: {
        vendorId: vendor._id,
        vendorEmail: vendor.email,
        searchTerm: search,
        orderType,
        totalCustomers: customers.length
      }
    });
  } catch (error) {
    console.error('Error fetching pharmacy customers for inbox:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
