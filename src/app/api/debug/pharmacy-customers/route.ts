import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PharmacyOrder from '@/models/PharmacyOrder';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Debug information
    const debugInfo = {
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
        role: (session.user as any).role,
        serviceType: (session.user as any).serviceType
      },
      totalOrders: await (PharmacyOrder as any).countDocuments(),
      ordersForUser: await (PharmacyOrder as any).countDocuments({ pharmacyId: session.user.id }),
      allOrders: await (PharmacyOrder as any).find().limit(3).select('orderNumber customerName pharmacyId').lean()
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
