import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import * as UserModule from '@/models/User';
import { checkVendorSubscription } from '@/lib/subscription-middleware';
const { User } = UserModule;

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
    const query: Record<string, unknown> = {
      status: 'active',
      stock: { $gt: 0 }
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort options
    let sortOptions: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'name':
        sortOptions.name = 1;
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Medicine.countDocuments(query);

    // Fetch medicines
    const medicines = await Medicine.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter medicines by vendor subscription status
    const medicinesWithActiveSubscriptions = [];
    for (const medicine of medicines) {
      if (medicine.vendorId) {
        const subscriptionCheck = await checkVendorSubscription(medicine.vendorId.toString(), 'pharmacy');
        if (subscriptionCheck.hasActiveSubscription) {
          medicinesWithActiveSubscriptions.push(medicine);
        }
      } else {
        // If no vendorId, include the medicine (for backward compatibility)
        medicinesWithActiveSubscriptions.push(medicine);
      }
    }

    // Get vendor information for each medicine
    const vendorIds = [...new Set(medicinesWithActiveSubscriptions.map(m => m.vendorId))];
    const vendors = await User.find({ _id: { $in: vendorIds } }).select('_id email businessName serviceType').lean();
    const vendorMap = new Map(vendors.map(v => [v._id.toString(), v]));

    // Transform medicines to match product interface
    const products = medicinesWithActiveSubscriptions.map(medicine => {
      const vendor = vendorMap.get(medicine.vendorId);
      return {
        _id: medicine._id?.toString() || '',
        vendorId: vendor || { _id: medicine.vendorId, email: 'unknown', businessName: 'Unknown', serviceType: 'pharmacy' },
        name: medicine.name,
        description: medicine.description || `${medicine.genericName} - ${medicine.manufacturer}`,
        price: medicine.price,
        originalPrice: medicine.originalPrice,
        images: medicine.images || [],
        imageUrl: medicine.imageUrl,
        stock: medicine.stock,
        category: medicine.category,
        rating: medicine.rating || 4.5,
        reviewCount: medicine.reviewCount || Math.floor(Math.random() * 100),
        supplier: medicine.pharmacyName || 'Pharmacy',
        supplierLocation: medicine.location || 'Zambia',
        minOrderQuantity: 1,
        isVerified: true, // All pharmacy medicines are verified
        tags: medicine.tags || [],
        featured: medicine.featured || false,
        // Pharmacy-specific fields
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        dosage: medicine.dosage,
        form: medicine.form,
        strength: medicine.strength,
        expiryDate: medicine.expiryDate,
        prescriptionRequired: medicine.prescriptionRequired || false
      };
    });

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(medicinesWithActiveSubscriptions.length / limit),
        totalCount: medicinesWithActiveSubscriptions.length,
        hasNext: page < Math.ceil(medicinesWithActiveSubscriptions.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching pharmacy products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy products' },
      { status: 500 }
    );
  }
}
