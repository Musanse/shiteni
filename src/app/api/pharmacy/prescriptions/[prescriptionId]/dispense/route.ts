import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Prescription from '@/models/Prescription';

export async function POST(request: NextRequest, { params }: { params: { prescriptionId: string } }) {
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

    const { prescriptionId } = params;

    // Find the prescription
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      pharmacyId: session.user.id
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Check if prescription is already dispensed
    if (prescription.status === 'dispensed') {
      return NextResponse.json({ error: 'Prescription already dispensed' }, { status: 400 });
    }

    // Check if prescription is expired
    if (prescription.status === 'expired') {
      return NextResponse.json({ error: 'Prescription has expired' }, { status: 400 });
    }

    // Update prescription status to dispensed
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        status: 'dispensed',
        dispensedDate: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    return NextResponse.json(
      { error: 'Failed to dispense prescription' },
      { status: 500 }
    );
  }
}
