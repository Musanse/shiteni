import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      paymentMethod
    } = body;

    // Validate required fields
    if (!roomId || !guestName || !guestEmail || !guestPhone || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the room
    const room = await (Room as any).findById(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Get session for customer ID (if user is logged in)
    const session = await getServerSession(authOptions);
    const customerId = session?.user?.email || 'guest';

    // Calculate total amount
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * nights;

    // Create booking using the proper Booking model
    const booking = new Booking({
      customerName: guestName,
      customerEmail: guestEmail,
      customerPhone: guestPhone,
      roomId: room._id.toString(),
      roomNumber: room.number,
      roomType: room.type,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: numberOfGuests || 1,
      adults: numberOfGuests || 1,
      children: 0,
      totalAmount,
      status: 'pending',
      paymentStatus: paymentMethod === 'check_in' ? 'pending' : 'paid',
      paymentMethod: paymentMethod || 'check_in',
      specialRequests: specialRequests || '',
      bookingSource: 'online',
      vendorId: room.vendorId.toString() // Link to hotel vendor
    });

    await (booking as any).save();

    console.log('Booking created successfully:', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      customerEmail: guestEmail,
      vendorId: room.vendorId,
      totalAmount
    });

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        roomNumber: room.number,
        roomType: room.type,
        customerName: booking.customerName,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error creating hotel booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
