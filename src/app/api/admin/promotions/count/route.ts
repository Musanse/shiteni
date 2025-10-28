import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Promotions count API called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    console.log('User role:', session?.user ? (session.user as any).role : 'No user');

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      console.log('❌ Unauthorized: User is not admin or super_admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authorized, connecting to database...');
    const dbConnection = await connectDB();
    
    if (!dbConnection) {
      console.log('❌ Database connection failed - MongoDB not available');
      return NextResponse.json({ 
        error: 'Database not available', 
        details: 'MongoDB connection not configured' 
      }, { status: 503 });
    }
    
    console.log('✅ Database connected');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const vendorType = searchParams.get('vendorType');
    const vendorId = searchParams.get('vendorId');
    
    console.log('Query params:', { type, vendorType, vendorId });

    let count = 0;

    try {
      if (type === 'vendors') {
        if (vendorType) {
          // Count vendors by type
          console.log(`Counting vendors of type: ${vendorType}`);
          count = await (User as any).countDocuments({
            role: { $in: ['manager', 'admin'] },
            serviceType: vendorType
          });
        } else {
          // Count all vendors
          console.log('Counting all vendors');
          count = await (User as any).countDocuments({
            role: { $in: ['manager', 'admin'] },
            serviceType: { $exists: true }
          });
        }
      } else if (type === 'vendor' && vendorId) {
        // Count specific vendor users
        console.log(`Counting users for vendor: ${vendorId}`);
        const vendor = await (User as any).findById(vendorId);
        if (vendor && vendor.businessId) {
          count = await (User as any).countDocuments({
            businessId: vendor.businessId
          });
        }
      } else if (type === 'customers') {
        // Count customers only
        console.log('Counting customers');
        count = await (User as any).countDocuments({
          role: 'customer'
        });
      } else {
        // Count all users
        console.log('Counting all users');
        count = await (User as any).countDocuments();
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }

    console.log(`✅ Count result: ${count}`);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('❌ Error counting recipients:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

