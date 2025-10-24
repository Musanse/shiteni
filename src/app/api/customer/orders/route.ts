import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { StoreOrder } from '@/models/Store';
import PharmacyOrder from '@/models/PharmacyOrder';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    // Ensure user exists (do not block non-"customer" roles from viewing their own orders)
    const user = await (User as any).findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch store orders
    const storeOrders = await (StoreOrder as any).find({ 
      customerId: userId 
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${storeOrders.length} store orders for customer ${userId}`);

    // Fetch pharmacy orders - handle ObjectId conversion and null values
    const pharmacyOrders = await (PharmacyOrder as any).find({ 
      $or: [
        { customerId: new mongoose.Types.ObjectId(userId) },
        { customerId: userId }, // Also try string match for backward compatibility
        { customerName: user?.name }, // Fallback to name match
        { customerEmail: user?.email } // Fallback to email match
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${pharmacyOrders.length} pharmacy orders for customer ${userId}`);

    // Transform store orders
    const transformedStoreOrders = storeOrders.map(order => {
      try {
        return {
          _id: order._id,
          orderNumber: order.orderNumber || `ST-${order._id.toString().slice(-8).toUpperCase()}`,
          vendorId: 'store-vendor', // Store orders don't have vendorId, use generic
          vendorName: 'Store Vendor',
          vendorEmail: 'store@shiteni.com',
          serviceType: 'store' as const,
          items: order.items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: undefined // Store items don't have image field
          })),
          totalAmount: order.total,
          status: order.status,
          orderDate: order.createdAt,
          deliveryDate: undefined, // Store orders don't have deliveryDate
          customerId: order.customerId,
          customerEmail: order.shippingAddress?.name || 'customer@shiteni.com',
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod || 'Cash on Delivery',
          paymentStatus: order.paymentStatus || 'pending',
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      } catch (error) {
        console.error('Error transforming store order:', order._id, error);
        return null;
      }
    }).filter(Boolean);

    // Transform pharmacy orders
    const transformedPharmacyOrders = pharmacyOrders.map(order => {
      try {
        return {
          _id: order._id,
          orderNumber: order.orderNumber || `PH-${order._id.toString().slice(-8).toUpperCase()}`,
          vendorId: order.pharmacyId?.toString() || 'pharmacy-vendor',
          vendorName: 'Pharmacy Vendor',
          vendorEmail: 'pharmacy@shiteni.com',
          serviceType: 'pharmacy' as const,
          items: order.items.map(item => ({
            productId: item.medicineId?.toString() || item._id?.toString(),
            name: item.medicineName,
            price: item.unitPrice,
            quantity: item.quantity,
            image: undefined // Pharmacy items don't have image field
          })),
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.orderDate || order.createdAt,
          deliveryDate: order.completedDate,
          customerId: order.customerId?.toString() || order.customerName,
          customerEmail: order.customerEmail || 'customer@shiteni.com',
          shippingAddress: order.customerAddress ? {
            street: order.customerAddress.street,
            city: order.customerAddress.city,
            district: order.customerAddress.state,
            postalCode: order.customerAddress.zipCode
          } : undefined,
          paymentMethod: order.paymentMethod || 'Cash on Delivery',
          paymentStatus: order.paymentStatus || 'pending',
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      } catch (error) {
        console.error('Error transforming pharmacy order:', order._id, error);
        return null;
      }
    }).filter(Boolean);

    // Combine and sort all orders
    const allOrders = [...transformedStoreOrders, ...transformedPharmacyOrders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return NextResponse.json({
      success: true,
      orders: allOrders
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Ensure user exists; don't block non-'customer' roles from placing an order
    let user = await (User as any).findById(session.user.id);
    if (!user) {
      user = new User({
        _id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email?.split('@')[0],
        role: 'customer'
      });
      await (user as any).save();
    }

    const body = await request.json();
    const { items, shippingAddress, paymentMethod } = body as {
      items: Array<{
        productId?: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      shippingAddress?: any;
      paymentMethod?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to order' }, { status: 400 });
    }

    // Compute totals
    const normalizedItems = items.map((it) => ({
      productId: it.productId || 'unknown',
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      total: Number((it.price * it.quantity).toFixed(2))
    }));

    const subtotal = normalizedItems.reduce((s, it) => s + it.total, 0);
    const tax = 0;
    const shipping = 0;
    const discount = 0;
    const total = subtotal + tax + shipping - discount;

    // Minimal shipping address fallback from session
    const safe = (v: any, fallback: string) => (typeof v === 'string' && v.trim().length > 0 ? v : fallback);
    const baseName = user.name || session.user.email?.split('@')[0] || 'Customer';
    const incoming = shippingAddress || {};
    const finalShipping = {
      name: safe(incoming.name, baseName),
      street: safe(incoming.street, 'Unknown Street'),
      city: safe(incoming.city, 'Unknown City'),
      state: safe(incoming.state, 'Unknown State'),
      country: safe(incoming.country, 'Zambia'),
      zipCode: safe(incoming.zipCode, '00000'),
      phone: safe(incoming.phone, '0000000000')
    };

    // Generate simple order number
    const orderCount = await StoreOrder.countDocuments();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    const order = new StoreOrder({
      customerId: session.user.id,
      orderNumber,
      items: normalizedItems,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'cash',
      shippingAddress: finalShipping,
      billingAddress: finalShipping,
      notes: ''
    });

    try {
      await (order as any).save();
    } catch (err: any) {
      console.error('Order validation error:', err);
      return NextResponse.json({ error: err?.message || 'Validation failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error placing customer order:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to place order' }, { status: 500 });
  }
}
