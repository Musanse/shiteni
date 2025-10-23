import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreProduct } from '@/models/Store';
import { requireVendorApproval } from '@/lib/vendor-auth';
import { checkVendorSubscription } from '@/lib/subscription-middleware';

export async function GET(request: NextRequest) {
  try {
    // Allow public access for browsing products
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    // Build sort
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-low') {
      sortQuery = { price: 1 };
    } else if (sort === 'price-high') {
      sortQuery = { price: -1 };
    } else if (sort === 'rating') {
      sortQuery = { rating: -1 };
    } else if (sort === 'newest') {
      sortQuery = { createdAt: -1 };
    } else if (sort === 'featured') {
      sortQuery = { featured: -1, createdAt: -1 };
    }

    const products = await StoreProduct.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter products by vendor subscription status
    const productsWithActiveSubscriptions = [];
    for (const product of products) {
      if (product.vendorId) {
        const subscriptionCheck = await checkVendorSubscription(product.vendorId.toString(), 'store');
        if (subscriptionCheck.hasActiveSubscription) {
          productsWithActiveSubscriptions.push(product);
        }
      } else {
        // If no vendorId, include the product (for backward compatibility)
        productsWithActiveSubscriptions.push(product);
      }
    }

    // Get vendor information for products that have vendorId
    const productsWithVendorInfo = await Promise.all(productsWithActiveSubscriptions.map(async (product) => {
      if (product.vendorId) {
        try {
          const { User } = await import('@/models/User');
          const vendor = await User.findById(product.vendorId).select('email businessName serviceType').lean();
          return {
            ...product,
            vendorId: vendor || { _id: product.vendorId, email: 'Unknown', businessName: 'Unknown Vendor', serviceType: 'store' }
          };
        } catch (error) {
          console.error('Error fetching vendor info:', error);
          return {
            ...product,
            vendorId: { _id: product.vendorId, email: 'Unknown', businessName: 'Unknown Vendor', serviceType: 'store' }
          };
        }
      } else {
        // For products without vendorId, create a default vendor object
        return {
          ...product,
          vendorId: { _id: 'default', email: 'store@shiteni.com', businessName: 'Shiteni Store', serviceType: 'store' }
        };
      }
    }));

    const total = await StoreProduct.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      products: productsWithVendorInfo,
      totalProducts: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching store products:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch store products' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check vendor approval for product creation
    const vendorCheck = await requireVendorApproval(request);
    if (!vendorCheck.success) {
      return NextResponse.json({ 
        error: vendorCheck.error 
      }, { status: vendorCheck.status });
    }

    await connectDB();

    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      subcategory, 
      sku, 
      price, 
      cost, 
      stock, 
      minStock, 
      maxStock, 
      images, 
      specifications, 
      tags, 
      featured 
    } = body;

    // Validate required fields
    if (!name || !description || !category || !sku || 
        !price || !cost || !stock) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if user has permission to create products
    if (!['inventory_manager', 'manager', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if SKU already exists
    const existingProduct = await StoreProduct.findOne({ sku });
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'SKU already exists' 
      }, { status: 400 });
    }

    // Get the vendor ID from the session user
    const { User } = await import('@/models/User');
    const vendor = await User.findById(session.user.id);
    
    if (!vendor) {
      return NextResponse.json({ 
        error: 'Vendor not found' 
      }, { status: 404 });
    }

    const product = new StoreProduct({
      vendorId: vendor._id, // Link to the vendor creating the product
      name,
      description,
      category,
      subcategory: subcategory || '',
      sku,
      price,
      cost,
      stock,
      minStock: minStock || 0,
      maxStock: maxStock || 1000,
      images: images || [],
      specifications: specifications || {},
      tags: tags || [],
      featured: featured || false,
      status: 'active'
    });

    await product.save();

    return NextResponse.json({ 
      success: true, 
      product 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating store product:', error);
    return NextResponse.json({ 
      error: 'Failed to create store product' 
    }, { status: 500 });
  }
}
