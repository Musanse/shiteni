import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { planId, paymentMethod } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mock plan data - in real implementation, fetch from database
    const planPrices: { [key: string]: number } = {
      'starter': 2.00,
      'professional': 5.00,
      'enterprise': 10.00
    };

    const amount = planPrices[planId] || 2.00;

    // Initialize Lipila payment
    const lipilaResponse = await axios.post(
      `${process.env.LIPILA_BASE_URL}/api/v1/payments`,
      {
        amount: amount,
        currency: process.env.LIPILA_CURRENCY || 'ZMW',
        description: `Store subscription upgrade to ${planId}`,
        customer_email: user.email,
        customer_name: user.name || `${user.firstName} ${user.lastName}`,
        customer_phone: user.phone || '',
        payment_method: 'mobile_money',
        callback_url: `${process.env.NEXTAUTH_URL}/api/store/subscription/payment-callback`,
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/vendor/store/subscription?success=true`,
        failure_url: `${process.env.NEXTAUTH_URL}/dashboard/vendor/store/subscription?error=true`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LIPILA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (lipilaResponse.data.success) {
      // Store payment reference in user record
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'subscription.pendingPlanId': planId,
          'subscription.pendingPaymentId': lipilaResponse.data.payment_id,
          'subscription.pendingAmount': amount
        }
      });

      return NextResponse.json({
        success: true,
        paymentUrl: lipilaResponse.data.payment_url,
        paymentId: lipilaResponse.data.payment_id,
        message: 'Payment initiated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize payment with Lipila'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Store subscription upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
