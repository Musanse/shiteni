import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder, StoreCustomer } from '@/models/Store';
import { requireVendorApproval } from '@/lib/vendor-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Generate order number
    const orderCount = await (StoreOrder as any).countDocuments();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    // Create or update customer record
    const customerEmail = shippingAddress.name.toLowerCase().replace(/\s+/g, '.') + '@customer.com';
    
    let customer = await (StoreCustomer as any).findOne({ 
      $or: [
        { email: customerEmail },
        { phone: shippingAddress.phone }
      ]
    });

    let finalCustomerId: string;

    if (!customer) {
      // Create new customer
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
    } else {
      // Update existing customer
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
      paymentMethod: paymentMethod || 'online',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: notes || 'Captured from online order'
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
      customer: customer,
      message: 'Online order captured successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error capturing online order:', error);
    return NextResponse.json({ 
      error: 'Failed to capture online order' 
    }, { status: 500 });
  }
}
