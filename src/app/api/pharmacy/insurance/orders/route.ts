import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    // Dynamic import to avoid build issues
    const { default: PharmacyOrder } = await import('@/models/PharmacyOrder');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'completed'; // Only completed orders for insurance claims
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query for orders that can be used for insurance claims
    const query: any = {
      pharmacyId: session.user.id,
      status: { $in: ['completed', 'ready'] }, // Only completed/ready orders
      totalAmount: { $gt: 0 } // Only orders with amounts
    };

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await PharmacyOrder.find(query)
      .sort({ orderDate: -1 })
      .limit(limit)
      .select('orderNumber customerName customerEmail customerPhone totalAmount orderDate status items');

    // Transform orders to include insurance-relevant information
    const ordersForInsurance = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      orderDate: order.orderDate,
      status: order.status,
      medicineCount: order.items.length,
      medicines: order.items.map(item => ({
        name: item.medicineName,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      }))
    }));

    return NextResponse.json({ 
      success: true, 
      orders: ordersForInsurance,
      total: ordersForInsurance.length
    });
  } catch (error) {
    console.error('Error fetching orders for insurance:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
