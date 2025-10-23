import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreOrder, StoreCustomer } from '@/models/Store';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const orderId = id;
    const body = await request.json();

    const allowedFields: Record<string, any> = {};

    if (body.status) allowedFields.status = body.status;
    if (body.paymentStatus) allowedFields.paymentStatus = body.paymentStatus;
    if (body.notes !== undefined) allowedFields.notes = body.notes;

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const updated = await StoreOrder.findByIdAndUpdate(
      id,
      { $set: { ...allowedFields, updatedAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // When marking delivered, ensure a customer record exists and update stats
    if (allowedFields.status === 'delivered') {
      try {
        const name = updated.shippingAddress?.name || 'Customer';
        const phone = updated.shippingAddress?.phone || '';
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ') || 'Customer';

        const existing = await StoreCustomer.findOne({ phone });
        if (!existing) {
          await StoreCustomer.create({
            firstName,
            lastName,
            email: '',
            phone,
            address: {
              street: updated.shippingAddress?.street || '',
              city: updated.shippingAddress?.city || '',
              state: updated.shippingAddress?.state || '',
              country: updated.shippingAddress?.country || '',
              zipCode: updated.shippingAddress?.zipCode || '',
            },
            loyaltyPoints: Math.floor((updated.total || 0) * 0.1),
            totalOrders: 1,
            totalSpent: updated.total || 0,
            lastOrder: new Date(),
          });
        } else {
          await StoreCustomer.updateOne(
            { _id: existing._id },
            {
              $inc: {
                totalOrders: 1,
                totalSpent: updated.total || 0,
                loyaltyPoints: Math.floor((updated.total || 0) * 0.1),
              },
              $set: { lastOrder: new Date() },
            }
          );
        }
      } catch (linkErr) {
        console.warn('Customer upsert on delivered failed:', linkErr);
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error updating store order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const order = await StoreOrder.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching store order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}


