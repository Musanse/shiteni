import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { lipilaPaymentService } from '@/lib/lipila-payment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    console.log(`🔍 Checking payment status for transactionId: ${transactionId}`);
    
    // Check with Lipila API for real payment status
    const paymentStatusResponse = await lipilaPaymentService.getTransactionStatus(transactionId);
    
    console.log(`📊 Lipila payment status response:`, paymentStatusResponse);

    return NextResponse.json({
      success: true,
      transactionId,
      paymentStatus: paymentStatusResponse.status,
      message: paymentStatusResponse.message,
      details: paymentStatusResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'successful':
      return 'Payment completed successfully';
    case 'failed':
      return 'Payment failed - please try again';
    case 'cancelled':
      return 'Payment was cancelled by user';
    case 'pending':
      return 'Payment is still being processed';
    default:
      return 'Unknown payment status';
  }
}
