import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusRoute schema
const BusRouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  departureCity: { type: String, required: true },
  arrivalCity: { type: String, required: true },
  departureTime: String,
  arrivalTime: String,
  duration: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  images: [String],
  imageUrl: String,
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  amenities: [String],
  busType: String,
  seatsAvailable: { type: Number, default: 50 },
  wifi: { type: Boolean, default: true },
  airConditioning: { type: Boolean, default: true },
  chargingPorts: { type: Boolean, default: true },
  refreshments: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  featured: { type: Boolean, default: false },
  tags: [String],
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busCompanyName: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BusRoute = mongoose.models.BusRoute || mongoose.model('BusRoute', BusRouteSchema);

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
      status: 'active',
      seatsAvailable: { $gt: 0 }
    };

    // Add search filter
    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { departureCity: { $regex: search, $options: 'i' } },
        { arrivalCity: { $regex: search, $options: 'i' } },
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
        sortOptions.routeName = 1;
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, rating: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await (BusRoute as any).countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch bus routes
    const busRoutes = await (BusRoute as any).find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform bus routes to match product interface
    const products = busRoutes.map(route => ({
      _id: route._id.toString(),
      name: route.routeName,
      description: route.description || `${route.departureCity} to ${route.arrivalCity}`,
      price: route.price,
      originalPrice: route.originalPrice,
      images: route.images || [],
      imageUrl: route.imageUrl,
      stock: route.seatsAvailable,
      category: route.category,
      rating: route.rating || 4.5,
      reviewCount: route.reviewCount || Math.floor(Math.random() * 50),
      supplier: route.busCompanyName || 'Bus Company',
      supplierLocation: `${route.departureCity} - ${route.arrivalCity}`,
      minOrderQuantity: 1,
      isVerified: true, // All bus routes are verified
      tags: route.tags || [],
      featured: route.featured || false,
      // Bus-specific fields
      departureCity: route.departureCity,
      arrivalCity: route.arrivalCity,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      duration: route.duration,
      busType: route.busType,
      seatsAvailable: route.seatsAvailable,
      wifi: route.wifi,
      airConditioning: route.airConditioning,
      chargingPorts: route.chargingPorts,
      refreshments: route.refreshments,
      amenities: route.amenities || []
    }));

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bus products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus products' },
      { status: 500 }
    );
  }
}
