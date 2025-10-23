import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import * as HotelModule from '@/models/Hotel';
import * as UserModule from '@/models/User';
import Room from '@/models/Room';
const { HotelBooking } = HotelModule;
const { User } = UserModule;

export async function GET(request: NextRequest) {
  try {
    console.log('Hotels API called');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const amenities = searchParams.get('amenities') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');
    const city = searchParams.get('city') || '';

    // Get all hotel vendors
    let hotelVendors;
    try {
      hotelVendors = await User.find({
        serviceType: 'hotel',
        role: { $in: ['manager', 'admin'] }
      }).lean();
      console.log('Found hotel vendors:', hotelVendors.length);
    } catch (dbError) {
      console.error('Error fetching hotel vendors:', dbError);
      return NextResponse.json({
        success: true,
        hotels: [],
        message: 'Database error, no hotels available'
      });
    }
    console.log('Hotel vendors:', hotelVendors.map(v => ({ 
      id: v._id, 
      name: v.hotelName, 
      hasRooms: 'checking...' 
    })));

    // Get all rooms (including occupied ones since customers can book for future dates)
    const roomsQuery: Record<string, unknown> = {
      price: { $gte: minPrice, $lte: maxPrice }
    };

    // Add amenities filter
    if (amenities) {
      const amenityList = amenities.split(',').filter(Boolean);
      if (amenityList.length > 0) {
        roomsQuery.amenities = { $in: amenityList };
      }
    }

    let rooms;
    try {
      rooms = await Room.find(roomsQuery).lean();
      console.log('Found rooms:', rooms.length);
    } catch (dbError) {
      console.error('Error fetching rooms:', dbError);
      return NextResponse.json({
        success: true,
        hotels: [],
        message: 'Database error fetching rooms, no hotels available'
      });
    }

    // Group rooms by hotel vendor
    const hotelsMap = new Map();

    for (const vendor of hotelVendors) {
      // Filter rooms by vendorId to properly associate rooms with vendors
      const vendorRooms = rooms.filter(room => room.vendorId === vendor._id.toString());

      console.log(`Vendor ${vendor.hotelName} has ${vendorRooms.length} rooms`);

      // Show hotel even if no rooms (for demonstration)
      if (vendor.hotelName) {
        // Filter by search term
        const matchesSearch = !search || 
          vendor.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
          vendor.address?.street?.toLowerCase().includes(search.toLowerCase()) ||
          vendor.address?.city?.toLowerCase().includes(search.toLowerCase());

        // Filter by city
        const matchesCity = !city || 
          vendor.address?.city?.toLowerCase().includes(city.toLowerCase());

        if (matchesSearch && matchesCity) {
          hotelsMap.set(vendor._id.toString(), {
            _id: vendor._id.toString(),
            name: vendor.hotelName || 'Hotel',
            description: vendor.hotelDescription || 'A comfortable hotel for your stay',
            address: `${vendor.address?.street || ''}, ${vendor.address?.city || ''}, ${vendor.address?.country || 'Zambia'}`.trim().replace(/^,\s*|,\s*$/g, ''),
            phone: vendor.phone || '',
            email: vendor.email || '',
            amenities: vendor.hotelAmenities || [],
            rating: 4.5, // Default rating, you can calculate this from reviews
            images: vendor.hotelGalleryImages && vendor.hotelGalleryImages.length > 0 
              ? vendor.hotelGalleryImages 
              : ['/hotel-placeholder.jpg'], // Use gallery images or default
            rooms: vendorRooms.map(room => ({
              _id: (room._id as { toString(): string })?.toString() || 'unknown',
              roomNumber: room.number,
              roomType: room.type,
              floor: room.floor,
              capacity: room.maxGuests,
              amenities: room.amenities,
              pricePerNight: room.price,
              status: room.status,
              description: room.description,
              images: room.images && room.images.length > 0 ? room.images : 
                     (room.featuredImage ? [room.featuredImage] : ['/room-placeholder.jpg'])
            }))
          });
        }
      }
    }

    // Convert map to array
    const hotels = Array.from(hotelsMap.values());
    console.log('Final hotels count:', hotels.length);

    // Only return sample data if no real hotels exist
    if (hotels.length === 0) {
      console.log('No real hotels found, returning sample data');
      const sampleHotels = [
        {
          _id: 'sample-1',
          name: 'Grand Hotel Shiteni',
          description: 'Luxury hotel in the heart of Lusaka with world-class amenities',
          address: '123 Main Street, Lusaka, Zambia',
          phone: '+260 211 123456',
          email: 'info@grandhotelshiteni.com',
          amenities: ['wifi', 'parking', 'restaurant', 'gym', 'pool'],
          rating: 4.8,
          images: ['/hotel-placeholder.jpg'],
          rooms: [
            {
              _id: 'room-1',
              roomNumber: '101',
              roomType: 'Deluxe Suite',
              floor: 1,
              capacity: 2,
              amenities: ['wifi', 'parking'],
              pricePerNight: 2500,
              status: 'available',
              description: 'Spacious suite with city view',
              images: ['/room-placeholder.jpg']
            },
            {
              _id: 'room-2',
              roomNumber: '102',
              roomType: 'Standard Room',
              floor: 1,
              capacity: 2,
              amenities: ['wifi'],
              pricePerNight: 1500,
              status: 'available',
              description: 'Comfortable standard room',
              images: ['/room-placeholder.jpg']
            }
          ]
        },
        {
          _id: 'sample-2',
          name: 'Lusaka Business Hotel',
          description: 'Modern business hotel perfect for corporate travelers',
          address: '456 Business District, Lusaka, Zambia',
          phone: '+260 211 234567',
          email: 'info@lusakabusiness.com',
          amenities: ['wifi', 'parking', 'restaurant'],
          rating: 4.5,
          images: ['/hotel-placeholder.jpg'],
          rooms: [
            {
              _id: 'room-3',
              roomNumber: '201',
              roomType: 'Executive Room',
              floor: 2,
              capacity: 1,
              amenities: ['wifi', 'parking'],
              pricePerNight: 1800,
              status: 'available',
              description: 'Executive room with work desk',
              images: ['/room-placeholder.jpg']
            }
          ]
        }
      ];

      return NextResponse.json({
        success: true,
        hotels: sampleHotels,
        message: 'Showing sample hotels. No real hotels found in database.'
      });
    }

    return NextResponse.json({
      success: true,
      hotels,
      message: `Found ${hotels.length} real hotel(s) from database`
    });

  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}
