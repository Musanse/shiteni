import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const planFilter = searchParams.get('plan') || 'all';

    let matchStage: any = {};

    if (statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    if (planFilter !== 'all') {
      matchStage.planType = planFilter;
    }

    const subscriptions = await (Subscription as any).aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $addFields: {
          userName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          userEmail: '$userInfo.email',
          businessName: '$userInfo.businessName',
          serviceType: '$userInfo.serviceType',
          daysUntilExpiry: {
            $divide: [
              { $subtract: ['$endDate', new Date()] },
              86400000 // milliseconds in a day
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,
          userEmail: 1,
          businessName: 1,
          serviceType: 1,
          planType: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          billingCycle: 1,
          amount: 1,
          currency: 1,
          features: 1,
          maxUsers: 1,
          maxLoans: 1,
          maxStorage: 1,
          paymentMethod: 1,
          lastPaymentDate: 1,
          nextPaymentDate: 1,
          autoRenew: 1,
          notes: 1,
          daysUntilExpiry: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Calculate metrics
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired').length;
    const suspendedSubscriptions = subscriptions.filter(s => s.status === 'suspended').length;
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.billingCycle === 'monthly')
      .reduce((sum, sub) => sum + sub.amount, 0);
    const yearlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.billingCycle === 'yearly')
      .reduce((sum, sub) => sum + sub.amount, 0);

    // Plan type distribution
    const planDistribution = subscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusDistribution = subscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Expiring soon (within 30 days)
    const expiringSoon = subscriptions.filter(s => 
      s.status === 'active' && s.daysUntilExpiry <= 30 && s.daysUntilExpiry > 0
    ).length;

    const metrics = {
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedSubscriptions,
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      expiringSoon,
      planDistribution,
      statusDistribution,
    };

    return NextResponse.json({ subscriptions, metrics });
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      institutionId,
      planType,
      billingCycle,
      amount,
      startDate,
      endDate,
      features,
      maxUsers,
      maxLoans,
      maxStorage,
      paymentMethod,
      autoRenew,
      notes
    } = body;

    // Get institution info
    const institution = await (User as any).findById(institutionId);
    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Calculate next payment date based on billing cycle
    let nextPaymentDate = new Date(endDate);
    if (billingCycle === 'monthly') {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    } else if (billingCycle === 'quarterly') {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
    } else if (billingCycle === 'yearly') {
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    }

    const subscription = new Subscription({
      institutionId,
      institutionName: institution.businessName || `${institution.firstName} ${institution.lastName}`,
      planType,
      status: 'active',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      billingCycle,
      amount,
      currency: 'ZMW',
      features: features || [],
      maxUsers,
      maxLoans,
      maxStorage,
      paymentMethod,
      nextPaymentDate,
      autoRenew: autoRenew !== false,
      notes
    });

    await subscription.save();

    return NextResponse.json({ 
      message: 'Subscription created successfully',
      subscription 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { subscriptionId, action, ...updateData } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing subscription ID or action' }, { status: 400 });
    }

    let updateFields: any = {};

    switch (action) {
      case 'activate':
        updateFields = { status: 'active' };
        break;
      case 'suspend':
        updateFields = { status: 'suspended' };
        break;
      case 'cancel':
        updateFields = { status: 'cancelled', autoRenew: false };
        break;
      case 'renew':
        updateFields = { 
          status: 'active',
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          lastPaymentDate: new Date()
        };
        break;
      case 'update':
        updateFields = { ...updateData };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const subscription = await (Subscription as any).findByIdAndUpdate(
      subscriptionId,
      updateFields,
      { new: true }
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Subscription updated successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
