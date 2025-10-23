import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreProduct } from '@/models/Store';
import { requireVendorApproval } from '@/lib/vendor-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const product = await StoreProduct.findById(id);
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check vendor approval for product updates
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

    // Check if user has permission to update products
    if (!['inventory_manager', 'manager', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if SKU already exists for a different product
    const existingProduct = await StoreProduct.findOne({ 
      sku, 
      _id: { $ne: id } 
    });
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'SKU already exists for another product' 
      }, { status: 400 });
    }

    const updatedProduct = await StoreProduct.findByIdAndUpdate(
      id,
      {
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
        status: stock === 0 ? 'out_of_stock' : 'active'
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      product: updatedProduct 
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ 
      error: 'Failed to update product' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check vendor approval for product deletion
    const vendorCheck = await requireVendorApproval(request);
    if (!vendorCheck.success) {
      return NextResponse.json({ 
        error: vendorCheck.error 
      }, { status: vendorCheck.status });
    }

    await connectDB();

    // Check if user has permission to delete products
    if (!['inventory_manager', 'manager', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const deletedProduct = await StoreProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ 
      error: 'Failed to delete product' 
    }, { status: 500 });
  }
}
