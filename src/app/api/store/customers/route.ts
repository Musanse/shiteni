import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { StoreCustomer, StoreOrder } from '@/models/Store';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the store vendor or staff member
    let vendor = await User.findOne({ 
      email: session.user.email,
      serviceType: 'store'
    });

    // If not found as vendor, check if this is a staff member
    if (!vendor) {
      const staff = await User.findOne({ 
        email: session.user.email,
        role: { $in: ['cashier', 'inventory_manager', 'sales_associate', 'admin'] },
        serviceType: 'store'
      });
      
      if (staff && staff.businessId) {
        // Find the actual store vendor using businessId
        vendor = await User.findById(staff.businessId);
        console.log(`Staff member ${staff.email} accessing customers for store vendor: ${vendor?.email}`);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Store vendor not found' }, { status: 404 });
    }

    // Proactive backfill: derive customers from orders and upsert into storecustomers
    try {
      const derivedAll = await StoreOrder.aggregate([
        {
          $group: {
            _id: {
              phone: '$shippingAddress.phone',
              name: { $ifNull: ['$shippingAddress.name', 'Customer'] },
              city: '$shippingAddress.city',
              state: '$shippingAddress.state',
              country: '$shippingAddress.country',
              zipCode: '$shippingAddress.zipCode',
            },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            lastOrder: { $max: '$createdAt' },
          },
        },
        {
          $project: {
            _id: 0,
            phone: '$_id.phone',
            name: '$_id.name',
            address: {
              street: { $literal: '' },
              city: '$_id.city',
              state: '$_id.state',
              country: '$_id.country',
              zipCode: '$_id.zipCode',
            },
            totalOrders: 1,
            totalSpent: 1,
            lastOrder: 1,
          },
        },
      ]);

      if (Array.isArray(derivedAll) && derivedAll.length > 0) {
        const ops = derivedAll.map((c: any) => {
          const parts = (c.name || 'Customer').split(' ');
          const firstName = parts[0] || 'Customer';
          const lastName = parts.slice(1).join(' ') || 'Customer';
          return {
            updateOne: {
              filter: c.phone ? { phone: c.phone } : { firstName, lastName, 'address.city': c.address.city || '' },
              update: {
                $setOnInsert: {
                  email: '',
                },
                $set: {
                  firstName,
                  lastName,
                  phone: c.phone || '',
                  address: c.address,
                  lastOrder: c.lastOrder ? new Date(c.lastOrder) : new Date(),
                  totalOrders: c.totalOrders || 0,
                  totalSpent: c.totalSpent || 0,
                  loyaltyPoints: Math.floor((c.totalSpent || 0) * 0.1),
                },
              },
              upsert: true,
            },
          };
        });
        if (ops.length > 0) {
          await StoreCustomer.bulkWrite(ops, { ordered: false });
        }
      }
    } catch (prefillErr) {
      console.warn('Customers prefill from orders failed:', prefillErr);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Build sort
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sortBy === 'highest-spent') {
      sortQuery = { totalSpent: -1 };
    } else if (sortBy === 'most-orders') {
      sortQuery = { totalOrders: -1 };
    } else if (sortBy === 'most-points') {
      sortQuery = { loyaltyPoints: -1 };
    }

    let customers = await StoreCustomer.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    let total = await StoreCustomer.countDocuments(query);

    // Fallback: derive customers from StoreOrder collection when customer collection is empty
    if (total === 0) {
      // Build match stage based on search term
      const matchStage: Record<string, any> = {};
      if (search) {
        matchStage.$or = [
          { 'shippingAddress.name': { $regex: search, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } }
        ];
      }

      const sortStage: Record<string, 1 | -1> = (() => {
        if (sortBy === 'oldest') return { lastOrder: 1 };
        if (sortBy === 'highest-spent') return { totalSpent: -1 };
        if (sortBy === 'most-orders') return { totalOrders: -1 };
        if (sortBy === 'most-points') return { loyaltyPoints: -1 };
        return { lastOrder: -1 };
      })();

      const pipeline: any[] = [
        Object.keys(matchStage).length ? { $match: matchStage } : undefined,
        {
          $group: {
            _id: {
              name: { $ifNull: ['$shippingAddress.name', 'Customer'] },
              phone: '$shippingAddress.phone',
              city: '$shippingAddress.city',
              state: '$shippingAddress.state',
              country: '$shippingAddress.country',
              zipCode: '$shippingAddress.zipCode',
            },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            lastOrder: { $max: '$createdAt' },
          },
        },
        {
          $project: {
            _id: 0,
            firstName: { $arrayElemAt: [ { $split: [ { $ifNull: ['$_id.name', 'Customer'] }, ' ' ] }, 0 ] },
            lastName: {
              $let: {
                vars: { parts: { $split: [ { $ifNull: ['$_id.name', 'Customer'] }, ' ' ] } },
                in: {
                  $cond: [
                    { $gt: [{ $size: '$$parts' }, 1] },
                    { $reduce: { input: { $slice: ['$$parts', 1, { $size: '$$parts' }] }, initialValue: '', in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', ' '] }, '$$this'] } } },
                    'Customer'
                  ],
                },
              },
            },
            email: { $literal: '' },
            phone: '$_id.phone',
            address: {
              street: { $literal: '' },
              city: '$_id.city',
              state: '$_id.state',
              country: '$_id.country',
              zipCode: '$_id.zipCode',
            },
            preferences: { categories: [], brands: [], priceRange: { min: 0, max: 10000 } },
            loyaltyPoints: { $floor: { $multiply: ['$totalSpent', 0.1] } },
            totalOrders: '$totalOrders',
            totalSpent: '$totalSpent',
            lastOrder: '$lastOrder',
            createdAt: '$lastOrder',
            updatedAt: '$lastOrder',
          },
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
      ].filter(Boolean);

      let derived: any[] = [];
      try {
        derived = await StoreOrder.aggregate(pipeline);
      } catch (aggError) {
        console.error('Fallback aggregation error:', aggError);
        derived = [];
      }
      customers = derived as any;

      // Count total derived customers for pagination
      try {
        const countPipeline: any[] = [];
        if (Object.keys(matchStage).length) countPipeline.push({ $match: matchStage });
        countPipeline.push({
          $group: {
            _id: {
              name: { $ifNull: ['$shippingAddress.name', 'Customer'] },
              phone: '$shippingAddress.phone',
              city: '$shippingAddress.city',
              state: '$shippingAddress.state',
              country: '$shippingAddress.country',
              zipCode: '$shippingAddress.zipCode',
            },
          },
        });
        const counted = await StoreOrder.aggregate(countPipeline);
        total = counted.length;
      } catch (countErr) {
        console.error('Fallback count aggregation error:', countErr);
        total = customers.length;
      }

      // Persist backfill into storecustomers so future reads come from collection
      if (customers.length > 0) {
        try {
          const ops = customers.map((c: any) => ({
            updateOne: {
              filter: { phone: c.phone || '', email: c.email || '' },
              update: {
                $setOnInsert: {
                  firstName: c.firstName || 'Customer',
                  lastName: c.lastName || 'Customer',
                  email: c.email || '',
                },
                $set: {
                  phone: c.phone || '',
                  address: c.address || { street: '', city: '', state: '', country: '', zipCode: '' },
                  preferences: c.preferences || { categories: [], brands: [], priceRange: { min: 0, max: 10000 } },
                  lastOrder: c.lastOrder ? new Date(c.lastOrder) : new Date(),
                },
                $inc: {
                  totalOrders: c.totalOrders || 0,
                  totalSpent: c.totalSpent || 0,
                  loyaltyPoints: c.loyaltyPoints || 0,
                },
              },
              upsert: true,
            },
          }));

          if (ops.length > 0) {
            await StoreCustomer.bulkWrite(ops, { ordered: false });
          }
        } catch (persistErr) {
          console.warn('Backfill persist to storecustomers failed:', persistErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      customers,
      totalCustomers: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      derived: total === 0, // hint: came from orders fallback
    });

  } catch (error) {
    console.error('Error fetching store customers:', error);
    // Be resilient in development: return empty set with success=true so UI can load
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        customers: [],
        totalCustomers: 0,
        totalPages: 0,
        currentPage: 1,
        derived: false,
      });
    }
    return NextResponse.json({ 
      error: 'Failed to fetch store customers' 
    }, { status: 500 });
  }
}
