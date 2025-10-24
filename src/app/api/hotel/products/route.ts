import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { checkVendorSubscription } from '@/lib/subscription-middleware';

// Define Hotel schema
const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  location: String,
  city: String,
  country: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  images: [String],
  imageUrl: String,
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  amenities: [String],
  roomTypes: [String],
  checkInTime: String,
  checkOutTime: String,
  wifi: { type: Boolean, default: true },
  parking: { type: Boolean, default: false },
  pool: { type: Boolean, default: false },
  gym: { type: Boolean, default: false },
  restaurant: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  featured: { type: Boolean, default: false },
  tags: [String],
  hotelId: { type: mongoose.Schema.Types.ObjectId, required: true },
  hotelName: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'featured';

    // Build query
    const query: any = {
      status: 'active'
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      case 'name':
        sortOptions.name = 1;
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, rating: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await (Hotel as any).countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch hotels
    const hotels = await (Hotel as any).find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter hotels by vendor subscription status
    const hotelsWithActiveSubscriptions = [];
    for (const hotel of hotels) {
      const subscriptionCheck = await checkVendorSubscription(hotel.hotelId.toString(), 'hotel');
      if (subscriptionCheck.hasActiveSubscription) {
        hotelsWithActiveSubscriptions.push(hotel);
      }
    }

    // Transform hotels to match product interface
    const products = hotelsWithActiveSubscriptions.map(hotel => ({
      _id: hotel._id.toString(),
      name: hotel.name,
      description: hotel.description || `${hotel.category} hotel in ${hotel.city || hotel.location}`,
      price: hotel.price,
      originalPrice: hotel.originalPrice,
      images: hotel.images || [],
      imageUrl: hotel.imageUrl,
      stock: 1, // Hotels have availability, not stock
      category: hotel.category,
      rating: hotel.rating || 4.5,
      reviewCount: hotel.reviewCount || Math.floor(Math.random() * 100),
      supplier: hotel.hotelName || 'Hotel',
      supplierLocation: hotel.location || `${hotel.city}, ${hotel.country}`,
      minOrderQuantity: 1,
      isVerified: true, // All hotels are verified
      tags: hotel.tags || [],
      featured: hotel.featured || false,
      // Hotel-specific fields
      amenities: hotel.amenities || [],
      roomTypes: hotel.roomTypes || [],
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      wifi: hotel.wifi,
      parking: hotel.parking,
      pool: hotel.pool,
      gym: hotel.gym,
      restaurant: hotel.restaurant
    }));

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(hotelsWithActiveSubscriptions.length / limit),
        totalCount: hotelsWithActiveSubscriptions.length,
        hasNext: page < Math.ceil(hotelsWithActiveSubscriptions.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching hotel products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel products' },
      { status: 500 }
    );
  }
}
