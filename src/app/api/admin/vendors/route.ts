import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { StoreProduct, StoreOrder } from '@/models/Store';
import { PharmacyMedicine } from '@/models/Pharmacy';
import { HotelRoom, HotelBooking } from '@/models/Hotel';
import { BusRoute, BusBooking } from '@/models/Bus';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch vendors (users with manager role - these are actual vendors)
    const vendors = await (User as any).find({
      role: 'manager'
    }).select('firstName lastName email phone address status kycStatus createdAt role').lean();

    // Fetch business statistics for each vendor
    const vendorStats = await Promise.all(
      vendors.map(async (vendor) => {
        let totalProducts = 0;
        let totalOrders = 0;
        let revenue = 0;

        // Calculate stats based on business type
        switch (vendor.businessType) {
          case 'store':
            const storeProducts = await (StoreProduct as any).countDocuments({ userId: vendor._id });
            const storeOrders = await (StoreOrder as any).find({ userId: vendor._id });
            totalProducts = storeProducts;
            totalOrders = storeOrders.length;
            revenue = storeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            break;
          case 'pharmacy':
            const pharmacyProducts = await PharmacyMedicine.countDocuments({ userId: vendor._id });
            totalProducts = pharmacyProducts;
            break;
          case 'hotel':
            const hotelRooms = await (HotelRoom as any).countDocuments({ userId: vendor._id });
            const hotelBookings = await (HotelBooking as any).find({ userId: vendor._id });
            totalProducts = hotelRooms;
            totalOrders = hotelBookings.length;
            revenue = hotelBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
            break;
          case 'bus':
            const busRoutes = await (BusRoute as any).countDocuments({ userId: vendor._id });
            const busBookings = await (BusBooking as any).find({ userId: vendor._id });
            totalProducts = busRoutes;
            totalOrders = busBookings.length;
            revenue = busBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
            break;
        }

        return {
          vendorId: vendor._id,
          totalProducts,
          totalOrders,
          revenue
        };
      })
    );

    // Transform data for frontend
    const transformedVendors = vendors.map((vendor, index) => {
      const stats = vendorStats[index];
      
      // Determine business type based on role
      let businessType = 'General';
      if (vendor.role === 'manager') {
        businessType = 'Business Manager';
      } else if (vendor.role === 'admin') {
        businessType = 'Platform Admin';
      } else if (vendor.role === 'super_admin') {
        businessType = 'Super Admin';
      }
      
      return {
        _id: vendor._id,
        firstName: vendor.firstName || '',
        lastName: vendor.lastName || '',
        email: vendor.email,
        phone: vendor.phone || '',
        businessName: `${vendor.firstName} ${vendor.lastName}`,
        businessType: businessType,
        address: vendor.address?.street || '',
        city: vendor.address?.city || '',
        country: vendor.address?.country || '',
        status: vendor.status === 'active' ? 'approved' : 'pending',
        kycStatus: vendor.kycStatus || 'pending',
        documents: [],
        createdAt: vendor.createdAt,
        approvedAt: vendor.status === 'active' ? vendor.createdAt : undefined,
        suspendedAt: vendor.status === 'suspended' ? vendor.updatedAt : undefined,
        totalProducts: stats?.totalProducts || 0,
        totalOrders: stats?.totalOrders || 0,
        revenue: stats?.revenue || 0
      };
    });

    return NextResponse.json({ 
      success: true, 
      vendors: transformedVendors 
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
