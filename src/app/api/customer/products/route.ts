import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { StoreProduct } from '@/models/Store';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    // Fetch user to verify customer role
    const user = await User.findById(userId);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all available products from all vendors
    const products = await StoreProduct.find({ 
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .lean();

    // Transform products to include vendor information
    const transformedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: 'ZMW',
      category: product.category,
      vendorType: 'store',
      vendorName: product.supplier || 'Shiteni Store',
      vendorId: product._id,
      images: product.images || [],
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      availability: product.status === 'active' ? 'available' : product.status,
      tags: product.tags || [],
      location: {
        city: product.supplierLocation || 'Unknown',
        district: 'Unknown'
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}