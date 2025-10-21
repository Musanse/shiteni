import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define BusFare schema
const BusFareSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  fareAmount: { type: Number, required: true },
  currency: { type: String, default: 'ZMW', enum: ['ZMW', 'USD'] },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'seasonal'] },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Clear any existing model to ensure we use the updated schema
if (mongoose.models.BusFare) {
  delete mongoose.models.BusFare;
}
const BusFare = mongoose.model('BusFare', BusFareSchema);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userServiceType = (session.user as any)?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    const body = await request.json();
    const { routeName, origin, destination, fareAmount, currency, discount, status } = body;

    // Validate required fields
    if (!routeName || !origin || !destination || !fareAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const { id } = await params;
    const busCompanyId = session.user.id;

    const fare = await BusFare.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
      },
      {
        routeName,
        origin,
        destination,
        fareAmount: parseFloat(fareAmount),
        currency: currency || 'ZMW',
        discount: parseFloat(discount || 0),
        status: status || 'active',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!fare) {
      return NextResponse.json({ error: 'Fare not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      fare: {
        _id: fare._id.toString(),
        routeName: fare.routeName,
        origin: fare.origin,
        destination: fare.destination,
        fareAmount: fare.fareAmount,
        currency: fare.currency,
        discount: fare.discount,
        status: fare.status,
        createdAt: fare.createdAt.toISOString(),
        updatedAt: fare.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating bus fare:', error);
    return NextResponse.json(
      { error: 'Failed to update fare' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userServiceType = (session.user as any)?.serviceType;
    
    // Check if user has bus access
    if (userServiceType !== 'bus') {
      return NextResponse.json({ error: 'Access denied. Bus staff only.' }, { status: 403 });
    }

    await connectDB();

    const { id } = await params;
    const busCompanyId = session.user.id;

    const fare = await BusFare.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      busCompanyId: new mongoose.Types.ObjectId(busCompanyId)
    });

    if (!fare) {
      return NextResponse.json({ error: 'Fare not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Fare deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus fare:', error);
    return NextResponse.json(
      { error: 'Failed to delete fare' },
      { status: 500 }
    );
  }
}
