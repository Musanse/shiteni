import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { subscribe } from '@/lib/sse';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if user is a pharmacy vendor
  const userRole = (session?.user as any)?.role;
  const userServiceType = (session?.user as any)?.serviceType;
  
  if (userServiceType !== 'pharmacy' || !['pharmacist', 'technician', 'manager', 'admin'].includes(userRole)) {
    return new Response('Access denied. Pharmacy staff only.', { status: 403 });
  }

  // Channel can be vendorId or role-based; use user id fallback in dev
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || (session?.user?.id ?? 'public');

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      const unsubscribe = subscribe(channel, crypto.randomUUID(), send);
      // Initial open event
      send(`event: open\n` + `data: {"ok":true}\n\n`);
      // Close handling
      const close = () => {
        try { unsubscribe(); } catch {}
        try { controller.close(); } catch {}
      };
      // @ts-ignore - next runtime provides close via signal
      request.signal?.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
