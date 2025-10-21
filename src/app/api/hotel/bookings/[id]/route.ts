import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only hotel managers can update bookings
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      checkIn,
      checkOut,
      guests,
      adults,
      children,
      totalAmount,
      status,
      paymentStatus,
      paymentMethod,
      specialRequests,
      notes
    } = body;

    await connectDB();

    const booking = await Booking.findOne({ 
      _id: params.id, 
      vendorId: user.id 
    });
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking fields
    if (customerName !== undefined) booking.customerName = customerName;
    if (customerEmail !== undefined) booking.customerEmail = customerEmail;
    if (customerPhone !== undefined) booking.customerPhone = customerPhone;
    if (checkIn !== undefined) booking.checkIn = new Date(checkIn);
    if (checkOut !== undefined) booking.checkOut = new Date(checkOut);
    if (guests !== undefined) booking.guests = parseInt(guests);
    if (adults !== undefined) booking.adults = parseInt(adults);
    if (children !== undefined) booking.children = parseInt(children);
    if (totalAmount !== undefined) booking.totalAmount = parseFloat(totalAmount);
    if (status !== undefined) booking.status = status;
    if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) booking.paymentMethod = paymentMethod;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();

    // Create payment record if booking is confirmed and payment record doesn't exist
    if ((status === 'confirmed' || status === 'checked-in') && booking.paymentMethod) {
      try {
        // Check if payment record already exists
        const existingPayment = await Payment.findOne({ bookingId: booking._id.toString() });
        
        if (!existingPayment) {
          // Calculate fees based on payment method
          let fees = 0;
          if (booking.paymentMethod === 'credit_card' || booking.paymentMethod === 'debit_card') {
            fees = booking.totalAmount * 0.029; // 2.9% processing fee
          } else if (booking.paymentMethod === 'bank_transfer') {
            fees = booking.totalAmount * 0.01; // 1% bank fee
          } else if (booking.paymentMethod === 'mobile_money') {
            fees = booking.totalAmount * 0.015; // 1.5% mobile money fee
          }
          // Cash payments have no fees

          const netAmount = booking.totalAmount - fees;

          const payment = new Payment({
            bookingId: booking._id.toString(),
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            roomNumber: booking.roomNumber,
            roomType: booking.roomType,
            amount: booking.totalAmount,
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentMethod === 'cash' ? 'completed' : 'pending',
            processedBy: user.id,
            vendorId: user.id,
            currency: 'USD',
            fees,
            netAmount,
            notes: `Payment for booking ${booking.bookingNumber}`
          });

          await payment.save();
          console.log('Payment record created for booking update:', payment);
        }
      } catch (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Don't fail the booking update if payment record creation fails
      }
    }
    
    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking 
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; serviceType: string };
    
    // Only hotel managers can delete bookings
    if (user.role !== 'manager' || user.serviceType !== 'hotel') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const booking = await Booking.findOneAndDelete({ 
      _id: params.id, 
      vendorId: user.id 
    });
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
