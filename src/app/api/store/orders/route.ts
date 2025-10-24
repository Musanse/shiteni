import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder, StoreCustomer } from '@/models/Store';
import { requireVendorApproval } from '@/lib/vendor-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await (StoreOrder as any).find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await (StoreOrder as any).countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      orders,
      totalOrders: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching store orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch store orders' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check vendor approval for order creation
    const vendorCheck = await requireVendorApproval(request);
    if (!vendorCheck.success) {
      return NextResponse.json({ 
        error: vendorCheck.error 
      }, { status: vendorCheck.status });
    }

    await connectDB();

    const body = await request.json();
    const { 
      customerId,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      paymentMethod,
      shippingAddress,
      billingAddress,
      notes
    } = body;

    // Validate required fields
    if (!customerId || !items || !items.length || !total || !shippingAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if user has permission to create orders
    if (!['order_manager', 'manager', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate order number
    const orderCount = await (StoreOrder as any).countDocuments();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    // Create or update customer record
    let customer = await (StoreCustomer as any).findById(customerId);
    let finalCustomerId = customerId;
    
    if (!customer) {
      // Create new customer from order data
      const customerEmail = shippingAddress.name.toLowerCase().replace(/\s+/g, '.') + '@customer.com';
      
      customer = new StoreCustomer({
        firstName: shippingAddress.name.split(' ')[0] || 'Customer',
        lastName: shippingAddress.name.split(' ').slice(1).join(' ') || 'Unknown',
        email: customerEmail,
        phone: shippingAddress.phone,
        address: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          zipCode: shippingAddress.zipCode
        },
        preferences: {
          categories: [],
          brands: [],
          priceRange: { min: 0, max: 10000 }
        },
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null
      });
      
      await customer.save();
      finalCustomerId = customer._id.toString();
    }

    const order = new StoreOrder({
      customerId: finalCustomerId,
      orderNumber,
      items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'cash',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: notes || ''
    });

    await order.save();

    // Update customer statistics
    await (StoreCustomer as any).findByIdAndUpdate(finalCustomerId, {
      $inc: { 
        totalOrders: 1, 
        totalSpent: total,
        loyaltyPoints: Math.floor(total * 0.1) // 10% of order value as loyalty points
      },
      lastOrder: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      order,
      customer: customer
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating store order:', error);
    return NextResponse.json({ 
      error: 'Failed to create store order' 
    }, { status: 500 });
  }
}
