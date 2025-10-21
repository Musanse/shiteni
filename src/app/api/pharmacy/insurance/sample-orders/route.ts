import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
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

    // Check if orders already exist
    const existingOrders = await PharmacyOrder.countDocuments({ pharmacyId: session.user.id });
    
    if (existingOrders > 0) {
      // Update existing orders to be eligible for insurance claims
      const updateResult = await PharmacyOrder.updateMany(
        { 
          pharmacyId: session.user.id,
          status: { $in: ['pending', 'confirmed', 'processing'] },
          totalAmount: { $gt: 0 }
        },
        { 
          $set: { 
            status: 'completed',
            paymentStatus: 'paid',
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: `Updated ${updateResult.modifiedCount} existing orders to completed status`,
        action: 'updated'
      });
    }

    // Create sample orders if none exist
    const sampleOrders = [
      {
        orderNumber: 'PH241201001',
        customerName: 'John Mwila',
        customerEmail: 'john.mwila@email.com',
        customerPhone: '+260977123456',
        items: [{
          medicineId: '507f1f77bcf86cd799439011',
          medicineName: 'Paracetamol 500mg',
          quantity: 2,
          unitPrice: 5.00,
          totalPrice: 10.00
        }],
        orderType: 'online',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'mobile_money',
        subtotal: 10.00,
        tax: 1.50,
        shippingFee: 2.00,
        totalAmount: 13.50,
        orderDate: new Date(),
        pharmacyId: session.user.id
      },
      {
        orderNumber: 'PH241201002',
        customerName: 'Mary Banda',
        customerEmail: 'mary.banda@email.com',
        customerPhone: '+260977654321',
        items: [{
          medicineId: '507f1f77bcf86cd799439012',
          medicineName: 'Amoxicillin 250mg',
          quantity: 1,
          unitPrice: 15.00,
          totalPrice: 15.00
        }],
        orderType: 'online',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        subtotal: 15.00,
        tax: 2.25,
        shippingFee: 3.00,
        totalAmount: 20.25,
        orderDate: new Date(),
        pharmacyId: session.user.id
      },
      {
        orderNumber: 'PH241201003',
        customerName: 'Peter Chanda',
        customerEmail: 'peter.chanda@email.com',
        customerPhone: '+260977987654',
        items: [{
          medicineId: '507f1f77bcf86cd799439013',
          medicineName: 'Ibuprofen 400mg',
          quantity: 3,
          unitPrice: 8.00,
          totalPrice: 24.00
        }],
        orderType: 'online',
        status: 'ready',
        paymentStatus: 'paid',
        paymentMethod: 'mobile_money',
        subtotal: 24.00,
        tax: 3.60,
        shippingFee: 2.50,
        totalAmount: 30.10,
        orderDate: new Date(),
        pharmacyId: session.user.id
      }
    ];

    const createdOrders = [];
    for (const orderData of sampleOrders) {
      const order = await PharmacyOrder.create(orderData);
      createdOrders.push({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${createdOrders.length} sample orders`,
      orders: createdOrders,
      action: 'created'
    });
  } catch (error) {
    console.error('Error creating/updating orders:', error);
    return NextResponse.json({ error: 'Failed to create/update orders' }, { status: 500 });
  }
}
