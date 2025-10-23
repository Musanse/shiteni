import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
// Import Medicine model
import Medicine from '@/models/Medicine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const medicine = await Medicine.findById(id).lean();

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      medicine
    });
  } catch (error) {
    console.error('Error fetching medicine:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicine' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'pharmacy') {
      return NextResponse.json({ error: 'Access denied. Pharmacy vendors only.' }, { status: 403 });
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
    if (!name || !genericName || !manufacturer || !category || !form || !price || !stock || !minStock || !expiryDate || !batchNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if medicine exists
    const existingMedicine = await Medicine.findById(id);
    if (!existingMedicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    // Determine status based on stock and expiry
    let status = 'active';
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < today) {
      status = 'expired';
    } else if (parseInt(stock) <= parseInt(minStock)) {
      status = 'low_stock';
    }

    // Update medicine
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      id,
      {
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
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      medicine: updatedMedicine
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'pharmacy') {
      return NextResponse.json({ error: 'Access denied. Pharmacy vendors only.' }, { status: 403 });
    }

    await connectDB();

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    await Medicine.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    );
  }
}
