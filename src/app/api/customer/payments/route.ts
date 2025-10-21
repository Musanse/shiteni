import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { BillingHistory } from '@/models/BillingHistory';
import { StoreOrder } from '@/models/Store';
import PharmacyOrder from '@/models/PharmacyOrder';
import Booking from '@/models/Booking';
import { BusBooking } from '@/models/Bus';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allPayments: any[] = [];

    // 1. Fetch Store Orders (Purchases)
    try {
      const storeOrders = await StoreOrder.find({ customerId: userId })
        .sort({ createdAt: -1 })
        .lean();

      storeOrders.forEach(order => {
        allPayments.push({
          _id: order._id,
          paymentType: 'purchase',
          serviceType: 'store',
          serviceName: `Store Order #${order.orderNumber || order._id.toString().slice(-6)}`,
          amount: order.total,
          currency: 'ZMW',
          status: order.paymentStatus === 'paid' ? 'completed' : order.paymentStatus === 'refunded' ? 'refunded' : 'pending',
          paymentMethod: order.paymentMethod || 'cash',
          transactionId: order._id.toString(),
          reference: `STORE-${order._id.toString().slice(-8).toUpperCase()}`,
          description: `Store purchase - ${order.items?.length || 0} items`,
          relatedBookingId: order._id,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        });
      });
    } catch (error) {
      console.error('Error fetching store orders:', error);
    }

    // 2. Fetch Pharmacy Orders (Purchases)
    try {
      const pharmacyOrders = await PharmacyOrder.find({
        $or: [
          { customerId: new mongoose.Types.ObjectId(userId) },
          { customerId: userId },
          { customerName: user?.name },
          { customerEmail: user?.email }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      pharmacyOrders.forEach(order => {
        allPayments.push({
          _id: order._id,
          paymentType: 'purchase',
          serviceType: 'pharmacy',
          serviceName: `Pharmacy Order #${order.orderNumber || order._id.toString().slice(-6)}`,
          amount: order.totalAmount || order.total,
          currency: 'ZMW',
          status: order.paymentStatus === 'paid' ? 'completed' : order.paymentStatus === 'refunded' ? 'refunded' : 'pending',
          paymentMethod: order.paymentMethod || 'cash',
          transactionId: order._id.toString(),
          reference: `PHARM-${order._id.toString().slice(-8).toUpperCase()}`,
          description: `Pharmacy purchase - ${order.items?.length || 0} items`,
          relatedBookingId: order._id,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        });
      });
    } catch (error) {
      console.error('Error fetching pharmacy orders:', error);
    }

    // 3. Fetch Hotel Bookings
    try {
      const hotelBookings = await Booking.find({ 
        $or: [
          { guestEmail: user.email },
          { guestName: user.name }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      hotelBookings.forEach(booking => {
        allPayments.push({
          _id: booking._id,
          paymentType: 'booking',
          serviceType: 'hotel',
          serviceName: `Hotel Booking #${booking._id.toString().slice(-6)}`,
          amount: booking.totalAmount,
          currency: 'ZMW',
          status: booking.paymentStatus === 'paid' ? 'completed' : booking.paymentStatus === 'partial' ? 'pending' : booking.paymentStatus === 'refunded' ? 'refunded' : 'pending',
          paymentMethod: booking.paymentMethod || 'cash',
          transactionId: booking._id.toString(),
          reference: `HOTEL-${booking._id.toString().slice(-8).toUpperCase()}`,
          description: `Hotel booking - ${booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : ''} to ${booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : ''}`,
          relatedBookingId: booking._id,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        });
      });
    } catch (error) {
      console.error('Error fetching hotel bookings:', error);
    }

    // 4. Fetch Bus Bookings
    try {
      const busBookings = await BusBooking.find({ 
        $or: [
          { passengerEmail: user.email },
          { passengerName: user.name }
        ]
      })
        .sort({ createdAt: -1 })
        .lean();

      busBookings.forEach(booking => {
        allPayments.push({
          _id: booking._id,
          paymentType: 'booking',
          serviceType: 'bus',
          serviceName: `Bus Booking #${booking._id.toString().slice(-6)}`,
          amount: booking.segmentFare || booking.fare,
          currency: 'ZMW',
          status: booking.paymentStatus === 'paid' || booking.status === 'confirmed' ? 'completed' : booking.paymentStatus === 'refunded' ? 'refunded' : 'pending',
          paymentMethod: booking.paymentMethod || 'cash',
          transactionId: booking._id.toString(),
          reference: `BUS-${booking._id.toString().slice(-8).toUpperCase()}`,
          description: `Bus booking - ${booking.boardingStop || ''} to ${booking.alightingStop || ''} - ${booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : ''}`,
          relatedBookingId: booking._id,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        });
      });
    } catch (error) {
      console.error('Error fetching bus bookings:', error);
    }

    // 5. Fetch Billing History (subscriptions, etc.)
    try {
      const billingHistory = await BillingHistory.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      billingHistory.forEach(payment => {
        allPayments.push({
          _id: payment._id,
          paymentType: payment.type || 'subscription',
          serviceType: payment.serviceType || 'general',
          serviceName: payment.description || 'Payment',
          amount: payment.amount,
          currency: payment.currency || 'ZMW',
          status: payment.status || 'completed',
          paymentMethod: payment.paymentMethod || 'card',
          transactionId: payment.transactionId || payment._id.toString(),
          reference: payment.reference || payment._id.toString(),
          description: payment.description,
          relatedBookingId: payment.relatedBookingId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        });
      });
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }

    // Sort all payments by date (newest first)
    allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      payments: allPayments,
      count: allPayments.length
    });

  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
