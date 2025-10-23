import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the hotel vendor or staff member
    const User = (await import('@/models/User')).User;
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'hotel'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['receptionist', 'housekeeping', 'manager', 'admin'] },
        serviceType: 'hotel'
      });
      
      if (staff && staff.institutionId) {
        // Find the actual hotel vendor using institutionId
        vendor = await User.findById(staff.institutionId);
        console.log(`Staff member ${staff.email} accessing bookings for hotel vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Hotel vendor not found' }, { status: 404 });
    }

    // Fetch bookings for this hotel vendor
    const bookings = await Booking.find({
      vendorId: vendor._id.toString()
    }).sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for hotel vendor: ${vendor.hotelName || vendor.email}`);

    return NextResponse.json({
      success: true,
      bookings: bookings.map(booking => ({
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        specialRequests: booking.specialRequests,
        bookingSource: booking.bookingSource,
        createdAt: booking.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching hotel bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}