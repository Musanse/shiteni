import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BusSchedule, BusRoute } from '@/models/Bus';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { checkVendorSubscription } from '@/lib/subscription-middleware';

// Define BusTrip schema (same as in trips API)
const BusTripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, required: true },
  busName: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  routeName: { type: String, required: true },
  departureTimes: {
    to: { type: String, required: true },
    from: { type: String, required: true }
  },
  daysOfWeek: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'cancelled'] },
  busCompanyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BusTrip = mongoose.models.BusTrip || mongoose.model('BusTrip', BusTripSchema);

// Define BusFare schema (same as in fares API)
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all bus vendors (users with serviceType 'bus')
    const busVendors = await (User as any).find({ 
      serviceType: 'bus',
      role: { $in: ['manager', 'admin', 'super_admin'] }
    }).lean();

    // Filter vendors by subscription status
    const vendorsWithActiveSubscriptions = [];
    for (const vendor of busVendors) {
      const subscriptionCheck = await checkVendorSubscription(vendor._id.toString(), 'bus');
      if (subscriptionCheck.hasActiveSubscription) {
        vendorsWithActiveSubscriptions.push(vendor);
      }
    }

    // Get all buses to get company information
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }
    const busFleets = await db.collection('buses').find({}).toArray();

    // Get all bus trips for scheduled trips
    const busTrips = await (BusTrip as any).find({ status: 'active' }).lean();

    // Get all bus routes for stop information
    const busRoutes = await (BusRoute as any).find({ status: 'active' }).lean();

    // Get all bus fares
    const busFares = await (BusFare as any).find({ status: 'active' }).lean();

    // Group buses by company/vendor
    const vendorMap = new Map();
    
    // Initialize vendors
    vendorsWithActiveSubscriptions.forEach(vendor => {
      // Format address as string
      let addressString = 'Zambia';
      if (vendor.businessAddress) {
        if (typeof vendor.businessAddress === 'string') {
          addressString = vendor.businessAddress;
        } else if (typeof vendor.businessAddress === 'object') {
          // Handle address object
          const addr = vendor.businessAddress as any;
          addressString = [addr.street, addr.city, addr.country].filter(Boolean).join(', ') || 'Zambia';
        }
      } else if (vendor.address) {
        if (typeof vendor.address === 'string') {
          addressString = vendor.address;
        } else if (typeof vendor.address === 'object') {
          // Handle address object
          const addr = vendor.address as any;
          addressString = [addr.street, addr.city, addr.country].filter(Boolean).join(', ') || 'Zambia';
        }
      }

    // Get company image from branding settings or fallback to business images
    let companyImages = ['/placeholder-bus.jpg'];
      if (vendor.businessImages && Array.isArray(vendor.businessImages) && vendor.businessImages.length > 0) {
        companyImages = vendor.businessImages;
      }
      // If there's a company image in branding settings, use it as the first image
      if (vendor.busBranding?.companyImage) {
        companyImages = [vendor.busBranding.companyImage, ...companyImages.filter(img => img !== vendor.busBranding.companyImage)];
        console.log('Using company image from busBranding:', vendor.busBranding.companyImage);
      } else {
        console.log('No company image found in busBranding for vendor:', vendor.businessName || vendor.name);
      }

      vendorMap.set(vendor._id.toString(), {
        _id: vendor._id.toString(),
        name: vendor.businessName || vendor.name || `${vendor.firstName} ${vendor.lastName}`,
        description: vendor.businessDescription || 'Professional bus transportation services',
        address: addressString,
        phone: vendor.phone || vendor.businessPhone || '',
        email: vendor.email,
        rating: 4.5, // Default rating
        images: companyImages,
        buses: [],
        scheduledTrips: [],
        routes: [],
        stops: [],
        totalRoutes: 0,
        totalBuses: 0,
        totalTrips: 0,
        amenities: ['Professional Drivers', 'Comfortable Seating', 'Air Conditioning', 'WiFi', 'Refreshments']
      });
    });

    // Add buses to their respective vendors
    busFleets.forEach(bus => {
      if (bus.vendorId && vendorMap.has(bus.vendorId.toString())) {
        const vendor = vendorMap.get(bus.vendorId.toString());
        vendor.buses.push({
          _id: bus._id.toString(),
          busName: bus.busName || `${bus.make || 'Unknown'} ${bus.model || 'Bus'}`,
          busNumber: bus.busNumberPlate || bus.busNumber || 'N/A',
          busImage: bus.image || bus.busImage || '/placeholder-bus.jpg',
          capacity: bus.numberOfSeats || bus.capacity || 50,
          amenities: bus.amenities || [],
          status: bus.status || 'active'
        });
        vendor.totalBuses++;
      }
    });

    // Add scheduled trips to their respective vendors
    busTrips.forEach(trip => {
      if (trip.busCompanyId && vendorMap.has(trip.busCompanyId.toString())) {
        const vendor = vendorMap.get(trip.busCompanyId.toString());
        vendor.scheduledTrips.push({
          _id: trip._id.toString(),
          tripName: trip.tripName,
          routeName: trip.routeName,
          busName: trip.busName,
          departureTimes: trip.departureTimes,
          daysOfWeek: trip.daysOfWeek,
          status: trip.status
        });
        vendor.totalTrips++;
      }
    });

    console.log('Bus routes found:', busRoutes.length);
    console.log('Bus trips found:', busTrips.length);
    console.log('Bus fares found:', busFares.length);

    // Add routes and stops to their respective vendors through trips
    busTrips.forEach(trip => {
      if (trip.busCompanyId && vendorMap.has(trip.busCompanyId.toString())) {
        const vendor = vendorMap.get(trip.busCompanyId.toString());
        
        // Find the route for this trip
        const route = busRoutes.find(r => r._id?.toString() === trip.routeId?.toString());
        
        if (route) {
          // Check if route already added to avoid duplicates
          if (!vendor.routes.find(r => r._id === route._id.toString())) {
            // Find fares for this route/company combination
            // Get all stops in this route
            const routeStops = route.stops?.map(stop => stop.stopName || stop.name) || [];
            
            const routeFares = busFares.filter(fare => 
              fare.busCompanyId?.toString() === trip.busCompanyId?.toString() &&
              routeStops.includes(fare.origin) && routeStops.includes(fare.destination)
            );


            // Convert fares to fare segments format
            const fareSegments = routeFares.map(fare => ({
              from: fare.origin,
              to: fare.destination,
              amount: fare.fareAmount
            }));

            vendor.routes.push({
              _id: route._id.toString(),
              routeName: route.routeName,
              routeNumber: route.routeNumber,
              origin: route.origin,
              destination: route.destination,
              stops: route.stops || [],
              fare: route.fare || 0,
              fareSegments: fareSegments
            });
            vendor.totalRoutes++;
          }
          
          // Add unique stops to vendor stops array
          if (route.stops && Array.isArray(route.stops)) {
            route.stops.forEach((stop: any) => {
              // Handle both old and new stop formats
              const stopName = stop.stopName || stop.name;
              const stopAddress = stop.address || '';
              const stopLatitude = stop.latitude || 0;
              const stopLongitude = stop.longitude || 0;
              
              if (!vendor.stops.find(s => s.name === stopName)) {
                vendor.stops.push({
                  name: stopName,
                  address: stopAddress,
                  latitude: stopLatitude,
                  longitude: stopLongitude
                });
              }
            });
          }
        }
      }
    });

    // Convert map to array
    const vendors = Array.from(vendorMap.values()).map(vendor => ({
      ...vendor,
      rating: 4.0 + Math.random() * 1.0 // Random rating between 4.0-5.0
    }));

    return NextResponse.json({
      success: true,
      vendors: vendors
    });

  } catch (error) {
    console.error('Error fetching bus vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus vendors' },
      { status: 500 }
    );
  }
}
