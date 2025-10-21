import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return session data for debugging
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: (session.user as any).role,
        serviceType: (session.user as any).serviceType,
        name: session.user.name
      }
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
