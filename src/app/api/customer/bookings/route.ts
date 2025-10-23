import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Room from '@/models/Room';
import { User } from '@/models/User';
import { BusBooking } from '@/models/Bus';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch hotel bookings for the logged-in customer
    const hotelBookings = await Booking.find({
      customerEmail: session.user.email
    }).sort({ createdAt: -1 });

    // Fetch bus bookings for the logged-in customer
    const busBookings = await BusBooking.find({
      passengerEmail: session.user.email
    }).sort({ createdAt: -1 });

    console.log(`Found ${hotelBookings.length} hotel bookings and ${busBookings.length} bus bookings for customer: ${session.user.email}`);

    // Process hotel bookings
    const processedHotelBookings = await Promise.all(
      hotelBookings.map(async (booking) => {
        try {
          // Find the room to get vendorId
          const room = await Room.findById(booking.roomId);
          if (!room) {
            console.log(`Room not found for booking ${booking._id}`);
            return {
              ...booking.toObject(),
              hotelName: 'Unknown Hotel'
            };
          }

          // Find the hotel vendor
          const hotelVendor = await User.findById(room.vendorId);
          const hotelName = hotelVendor?.hotelName || hotelVendor?.businessName || 'Unknown Hotel';

          return {
            ...booking.toObject(),
            hotelName,
            roomNumber: room.number,
            roomType: room.type
          };
        } catch (error) {
          console.error(`Error fetching hotel name for booking ${booking._id}:`, error);
          return {
            ...booking.toObject(),
            hotelName: 'Unknown Hotel'
          };
        }
      })
    );

    // Process bus bookings
    const processedBusBookings = await Promise.all(
      busBookings.map(async (booking) => {
        try {
          // Get trip and bus information
          const scheduleId = booking.scheduleId as string;
          const tripId = scheduleId.split('_')[0];
          
          // Find the trip
          const BusTripSchema = new mongoose.Schema({}, { strict: false });
          const BusTrip = mongoose.models.BusTrip || mongoose.model('BusTrip', BusTripSchema);
          const trip = await BusTrip.findById(tripId);
          
          if (trip) {
            // Get bus information
            const db = mongoose.connection.db;
            if (db) {
              const bus = await db.collection('buses').findOne({ _id: new mongoose.Types.ObjectId(trip.busId) });
              
              return {
                ...booking.toObject(),
                tripName: trip.tripName,
                busName: bus?.busName || 'Unknown Bus',
                busPlateNumber: bus?.plateNumber || 'N/A',
                busId: trip.busId
              };
            }
          }
          
          return {
            ...booking.toObject(),
            tripName: 'Unknown Trip',
            busName: 'Unknown Bus',
            busPlateNumber: 'N/A',
            busId: 'Unknown'
          };
        } catch (error) {
          console.error(`Error fetching bus info for booking ${booking._id}:`, error);
          return {
            ...booking.toObject(),
            tripName: 'Unknown Trip',
            busName: 'Unknown Bus',
            busPlateNumber: 'N/A',
            busId: 'Unknown'
          };
        }
      })
    );

    // Combine and format all bookings
    const allBookings = [
      // Hotel bookings
      ...processedHotelBookings.map(booking => ({
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingType: 'hotel' as const,
        serviceName: `${booking.hotelName} - ${booking.roomType} - Room ${booking.roomNumber}`,
        hotelName: booking.hotelName,
        bookingDate: booking.createdAt,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        status: booking.status,
        amount: booking.totalAmount,
        currency: 'ZMW',
        guestCount: booking.guests,
        roomType: booking.roomType,
        roomNumber: booking.roomNumber,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      })),
      // Bus bookings
      ...processedBusBookings.map(booking => ({
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingType: 'bus' as const,
        serviceName: `${booking.busPlateNumber || booking.busName} - ${booking.tripName}`,
        bookingDate: booking.createdAt,
        travelDate: booking.travelDate,
        departureTime: booking.travelDate, // You might want to get actual departure time from trip
        arrivalTime: booking.travelDate, // You might want to get actual arrival time from trip
        status: booking.status,
        amount: booking.fare || booking.segmentFare || 0,
        currency: 'ZMW',
        seatNumber: booking.seatNumber,
        routeName: booking.tripName,
        pickupLocation: booking.boardingStop,
        dropoffLocation: booking.alightingStop,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    ];

    // Sort all bookings by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      bookings: allBookings
    });

  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}