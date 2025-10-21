import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { BusBooking } from '@/models/Bus';
import mongoose from 'mongoose';

// Update booking status (payment or confirmation)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userServiceType = (session.user as { serviceType?: string })?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { bookingId, updateType, newStatus } = body;

    if (!bookingId || !updateType || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, updateType, newStatus' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await BusBooking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify this booking belongs to the vendor's trips
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'bus'
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Bus vendor not found' }, { status: 404 });
    }

    // Check if booking belongs to vendor's trips
    const BusTripSchema = new mongoose.Schema({}, { strict: false });
    const BusTrip = mongoose.models.BusTrip || mongoose.model('BusTrip', BusTripSchema);
    const trips = await BusTrip.find({ busCompanyId: vendor._id }).lean();
    const tripIds = trips.map(t => String(t._id));
    
    const scheduleId = booking.scheduleId as string;
    const tripId = scheduleId.split('_')[0];
    
    if (!tripIds.includes(tripId)) {
      return NextResponse.json({ error: 'Booking does not belong to this vendor' }, { status: 403 });
    }

    // Update the booking based on update type
    let updateData: any = {};
    
    if (updateType === 'payment') {
      updateData.paymentStatus = newStatus;
    } else if (updateType === 'confirmation') {
      updateData.status = newStatus;
    } else {
      return NextResponse.json(
        { error: 'Invalid updateType. Must be "payment" or "confirmation"' },
        { status: 400 }
      );
    }

    // Validate status values
    if (updateType === 'payment') {
      if (!['pending', 'paid', 'refunded'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status. Must be: pending, paid, refunded' },
          { status: 400 }
        );
      }
    } else if (updateType === 'confirmation') {
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid booking status. Must be: pending, confirmed, cancelled, completed' },
          { status: 400 }
        );
      }
    }

    // Update the booking
    const updatedBooking = await BusBooking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `${updateType === 'payment' ? 'Payment' : 'Booking'} status updated successfully`
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
