import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
// Import Medicine model
import Medicine from '@/models/Medicine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin', 'cashier'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query - filter by vendorId first
    const query: any = {
      vendorId: session.user.id
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch medicines with pagination
    const medicines = await (Medicine as any).find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMedicines = await (Medicine as any).countDocuments(query);
    const totalPages = Math.ceil(totalMedicines / limit);

    return NextResponse.json({
      success: true,
      medicines,
      pagination: {
        currentPage: page,
        totalPages,
        totalMedicines,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is pharmacy staff
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin', 'cashier'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Pharmacy staff only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      genericName,
      manufacturer,
      category,
      dosage,
      form,
      strength,
      price,
      stock,
      minStock,
      expiryDate,
      batchNumber,
      prescriptionRequired,
      description,
      sideEffects,
      contraindications,
      images
    } = body;

    // Validate required fields
    const requiredFields = {
      name,
      genericName,
      manufacturer,
      category,
      form,
      price,
      stock,
      minStock,
      expiryDate,
      batchNumber
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      console.log('📋 Received data:', requiredFields);
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields: missingFields 
      }, { status: 400 });
    }

    // Check if medicine already exists
    const existingMedicine = await (Medicine as any).findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      batchNumber
    });

    if (existingMedicine) {
      return NextResponse.json({ error: 'Medicine with this name and batch number already exists' }, { status: 400 });
    }

    // Determine status based on stock and expiry
    let status = 'active';
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < today) {
      status = 'expired';
    } else if (stock <= minStock) {
      status = 'low_stock';
    }

    // Create new medicine
    const medicine = new Medicine({
      name,
      genericName,
      manufacturer,
      category,
      dosage,
      form,
      strength,
      price: parseFloat(price),
      stock: parseInt(stock),
      minStock: parseInt(minStock),
      expiryDate,
      batchNumber,
      prescriptionRequired: prescriptionRequired || false,
      description: description || '',
      sideEffects: sideEffects || [],
      contraindications: contraindications || [],
      images: images || [],
      status,
      vendorId: session.user.id
    });

    await medicine.save();

    return NextResponse.json({
      success: true,
      medicine
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json(
      { error: 'Failed to create medicine' },
      { status: 500 }
    );
  }
}