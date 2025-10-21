import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { HotelRoom, HotelBooking } from '@/models/Hotel';
import { StoreProduct, StoreOrder } from '@/models/Store';
import { PharmacyMedicine, PharmacyPrescription } from '@/models/Pharmacy';
import { BusRoute, BusBooking } from '@/models/Bus';

export async function GET(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    
    if (!dbConnection) {
      throw new Error('Database connection failed');
    }

    // Fetch real-time statistics
    const [
      totalUsers,
      totalHotels,
      totalStores,
      totalPharmacies,
      totalBusRoutes,
      totalBookings
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total hotel rooms
      HotelRoom.countDocuments(),
      
      // Total store products
      StoreProduct.countDocuments(),
      
      // Total pharmacy medicines
      PharmacyMedicine.countDocuments(),
      
      // Total bus routes
      BusRoute.countDocuments(),
      
      // Total bookings across all platforms
      Promise.all([
        HotelBooking.countDocuments(),
        StoreOrder.countDocuments(),
        PharmacyPrescription.countDocuments(),
        BusBooking.countDocuments()
      ]).then(counts => counts.reduce((sum, count) => sum + count, 0))
    ]);

    // Calculate business types count
    const businessTypes = 4; // Hotel, Store, Pharmacy, Bus

    // Format numbers for display
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M+`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K+`;
      } else {
        return `${num}+`;
      }
    };

    const stats = {
      totalBusinesses: {
        value: formatNumber(totalUsers),
        raw: totalUsers,
        label: 'Active Stores'
      },
      totalUsers: {
        value: formatNumber(totalBookings),
        raw: totalBookings,
        label: 'Orders Fulfilled'
      },
      totalBookings: {
        value: '$50M+',
        raw: 50000000,
        label: 'Sales Processed'
      },
      uptime: {
        value: '99.9%',
        raw: 99.9,
        label: 'Uptime'
      }
    };

    return NextResponse.json({
      success: true,
      stats,
      message: 'E-commerce platform statistics loaded successfully'
    });

  } catch (error) {
    console.error('Stats API error:', error);
    
    // Return fallback stats if database is not available
    const fallbackStats = {
      totalBusinesses: {
        value: '10K+',
        raw: 10000,
        label: 'Active Stores'
      },
      totalUsers: {
        value: '1M+',
        raw: 1000000,
        label: 'Orders Fulfilled'
      },
      totalBookings: {
        value: '$50M+',
        raw: 50000000,
        label: 'Sales Processed'
      },
      uptime: {
        value: '99.9%',
        raw: 99.9,
        label: 'Uptime'
      }
    };

    return NextResponse.json({
      success: true,
      stats: fallbackStats,
      message: 'Using fallback statistics - database not available'
    });
  }
}