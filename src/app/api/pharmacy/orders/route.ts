import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PharmacyOrder from '@/models/PharmacyOrder';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const orderType = searchParams.get('orderType') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { pharmacyId: session.user.id };
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (orderType) {
      filter.orderType = orderType;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const orders = await PharmacyOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PharmacyOrder.countDocuments(filter);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pharmacy orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      orderType,
      paymentMethod,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      notes,
      orderDate
    } = body;

    // Validate required fields
    const requiredFields = {
      customerName,
      items,
      orderType,
      subtotal,
      totalAmount,
      orderDate
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields 
      }, { status: 400 });
    }

    // Generate order number
    const generateOrderNumber = async () => {
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      
      // Get count of orders for today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayOrdersCount = await PharmacyOrder.countDocuments({
        pharmacyId: session.user.id,
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });
      
      const orderSequence = (todayOrdersCount + 1).toString().padStart(3, '0');
      return `PH${year}${month}${day}${orderSequence}`;
    };

    const orderNumber = await generateOrderNumber();

    // Create new order
    const order = new PharmacyOrder({
      orderNumber,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      orderType,
      paymentMethod,
      subtotal,
      tax: tax || 0,
      shippingFee: shippingFee || 0,
      totalAmount,
      notes: notes || '',
      orderDate,
      pharmacyId: session.user.id
    });

    await order.save();

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating pharmacy order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
