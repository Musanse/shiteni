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

    // Check subscription status
    const subscriptionCheck = await checkVendorSubscription(session.user.id, 'bus');

    return NextResponse.json({
      hasActiveSubscription: subscriptionCheck.hasActiveSubscription,
      subscription: subscriptionCheck.subscription,
      error: subscriptionCheck.error
    });

  } catch (error) {
    console.error('Error checking bus subscription status:', error);
    return NextResponse.json({
      hasActiveSubscription: false,
      subscription: null,
      error: 'Failed to check subscription status'
    }, { status: 500 });
  }
}
