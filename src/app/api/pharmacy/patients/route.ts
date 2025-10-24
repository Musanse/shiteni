import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';

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
        { patientId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch patients with pagination
    const patients = await (Patient as any).find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalPatients = await (Patient as any).countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);

    return NextResponse.json({
      success: true,
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalPatients,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
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
      patientId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications,
      insuranceInfo
    } = body;

    // Validate required fields
    const requiredFields = {
      patientId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender
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

    // Check if patient already exists
    const existingPatient = await (Patient as any).findOne({
      $or: [
        { patientId },
        { email }
      ]
    });

    if (existingPatient) {
      return NextResponse.json({ 
        error: 'Patient with this ID or email already exists' 
      }, { status: 400 });
    }

    // Create new patient
    const patient = new Patient({
      patientId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address: address || {},
      emergencyContact: emergencyContact || {},
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      insuranceInfo: insuranceInfo || {},
      pharmacyId: session.user.id
    });

    await (patient as any).save();

    return NextResponse.json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
