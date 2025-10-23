import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { PHARMACY_PERMISSIONS } from '@/lib/pharmacy-rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    // Check if user has settings access (manager, admin only)
    if (userServiceType !== 'pharmacy' || !PHARMACY_PERMISSIONS.STAFF_MANAGEMENT.includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Manager or Admin only.' }, { status: 403 });
    }

    await connectDB();

    // Get pharmacy owner details
    const pharmacyOwner = await User.findById(session.user.id).lean();
    
    if (!pharmacyOwner) {
      return NextResponse.json({ error: 'Pharmacy owner not found' }, { status: 404 });
    }

    // Get pharmacy staff members
    const staffMembers = await User.find({
      businessId: session.user.id,
      serviceType: 'pharmacy',
      role: { $in: ['pharmacist', 'technician', 'cashier', 'manager', 'admin'] }
    }).lean();

    const pharmacySettings = {
      pharmacy: {
        id: pharmacyOwner._id.toString(),
        name: pharmacyOwner.businessName || 'Pharmacy',
        email: pharmacyOwner.email,
        phone: pharmacyOwner.phoneNumber,
        address: pharmacyOwner.address,
        city: pharmacyOwner.city,
        country: pharmacyOwner.country,
        licenseNumber: pharmacyOwner.licenseNumber,
        registrationNumber: pharmacyOwner.registrationNumber,
        isActive: pharmacyOwner.isActive,
        emailVerified: pharmacyOwner.emailVerified,
        createdAt: pharmacyOwner.createdAt,
        updatedAt: pharmacyOwner.updatedAt
      },
      staff: {
        total: staffMembers.length,
        members: staffMembers.map(staff => ({
          id: staff._id.toString(),
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          role: staff.role,
          isActive: staff.isActive,
          emailVerified: staff.emailVerified,
          permissions: staff.permissions,
          createdAt: staff.createdAt,
          lastLogin: staff.lastLogin
        }))
      },
      permissions: {
        canManageSettings: PHARMACY_PERMISSIONS.STAFF_MANAGEMENT.includes(userRole),
        canManageStaff: PHARMACY_PERMISSIONS.STAFF_MANAGEMENT.includes(userRole),
        canManageMedicines: PHARMACY_PERMISSIONS.MEDICINE_MANAGEMENT.includes(userRole),
        canManageOrders: PHARMACY_PERMISSIONS.ORDER_MANAGEMENT.includes(userRole)
      }
    };

    return NextResponse.json({ 
      success: true, 
      settings: pharmacySettings 
    });
  } catch (error) {
    console.error('Error fetching pharmacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userServiceType = (session.user as any).serviceType;
    
    // Check if user has settings access (manager, admin only)
    if (userServiceType !== 'pharmacy' || !PHARMACY_PERMISSIONS.STAFF_MANAGEMENT.includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Manager or Admin only.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      businessName, 
      phoneNumber, 
      address, 
      city, 
      country, 
      licenseNumber, 
      registrationNumber 
    } = body;

    await connectDB();

    // Update pharmacy owner details
    const updatedPharmacy = await User.findByIdAndUpdate(
      session.user.id,
      {
        businessName,
        phoneNumber,
        address,
        city,
        country,
        licenseNumber,
        registrationNumber,
        updatedAt: new Date()
      },
      { new: true, lean: true }
    );

    if (!updatedPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pharmacy settings updated successfully',
      pharmacy: {
        id: updatedPharmacy._id.toString(),
        name: updatedPharmacy.businessName,
        email: updatedPharmacy.email,
        phone: updatedPharmacy.phoneNumber,
        address: updatedPharmacy.address,
        city: updatedPharmacy.city,
        country: updatedPharmacy.country,
        licenseNumber: updatedPharmacy.licenseNumber,
        registrationNumber: updatedPharmacy.registrationNumber,
        updatedAt: updatedPharmacy.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating pharmacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update pharmacy settings' },
      { status: 500 }
    );
  }
}