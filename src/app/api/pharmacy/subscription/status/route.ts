import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkVendorSubscription } from '@/lib/subscription-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Pharmacy Subscription Status] Session user ID:', session.user.id);
    console.log('[Pharmacy Subscription Status] Session user:', session.user);

    // Check subscription status
    const subscriptionCheck = await checkVendorSubscription(session.user.id, 'pharmacy');

    console.log('[Pharmacy Subscription Status] Subscription check result:', subscriptionCheck);

    return NextResponse.json({
      hasActiveSubscription: subscriptionCheck.hasActiveSubscription,
      subscription: subscriptionCheck.subscription,
      error: subscriptionCheck.error
    });

  } catch (error) {
    console.error('Error checking pharmacy subscription status:', error);
    return NextResponse.json({
      hasActiveSubscription: false,
      subscription: null,
      error: 'Failed to check subscription status'
    }, { status: 500 });
  }
}
