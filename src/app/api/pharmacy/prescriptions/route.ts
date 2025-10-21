import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Prescription from '@/models/Prescription';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = { pharmacyId: session.user.id };
    
    if (search) {
      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch prescriptions with pagination
    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalPrescriptions = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(totalPrescriptions / limit);

    return NextResponse.json({
      success: true,
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages,
        totalPrescriptions,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
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

    // Check if user is a pharmacy vendor
    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    if (userRole !== 'manager' || userServiceType !== 'pharmacy') {
      return NextResponse.json({ error: 'Access denied. Pharmacy vendors only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      prescriptionNumber,
      patientId,
      patientName,
      doctorName,
      doctorLicense,
      medicines,
      diagnosis,
      notes,
      prescribedDate,
      expiryDate,
      prescriptionType,
      totalAmount
    } = body;

    // Validate required fields
    const requiredFields = {
      prescriptionNumber,
      patientId,
      patientName,
      doctorName,
      doctorLicense,
      medicines,
      diagnosis,
      prescribedDate,
      expiryDate,
      prescriptionType
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields: missingFields 
      }, { status: 400 });
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({
      prescriptionNumber
    });

    if (existingPrescription) {
      return NextResponse.json({ error: 'Prescription with this number already exists' }, { status: 400 });
    }

    // Create new prescription
    const prescription = new Prescription({
      prescriptionNumber,
      patientId,
      patientName,
      doctorName,
      doctorLicense,
      medicines,
      diagnosis,
      notes: notes || '',
      prescribedDate,
      expiryDate,
      prescriptionType,
      totalAmount: totalAmount || 0,
      pharmacyId: session.user.id
    });

    await prescription.save();

    return NextResponse.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
