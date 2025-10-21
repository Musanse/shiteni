import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';
import { BillingHistory } from '@/models/BillingHistory';

export async function POST(request: NextRequest) {
  try {
    console.log('Received Lipila webhook:', request.url);
    
    const body = await request.json();
    console.log('Webhook payload:', body);

    // Verify webhook signature if Lipila provides one
    // const signature = request.headers.get('x-lipila-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { transactionId, status, externalId, amount, currency } = body;

    if (!transactionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Find the billing record associated with this transaction
    const billingRecord = await BillingHistory.findOne({ 
      lipilaTransactionId: transactionId 
    });

    if (!billingRecord) {
      console.log(`No billing record found for transaction: ${transactionId}`);
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }

    console.log(`Found billing record: ${billingRecord._id} for transaction: ${transactionId}`);

    // Update billing record status based on webhook
    let newStatus: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';
    let paymentDate: Date | undefined;

    switch (status) {
      case 'Successful':
        newStatus = 'paid';
        paymentDate = new Date();
        break;
      case 'Failed':
        newStatus = 'failed';
        break;
      case 'Pending':
        newStatus = 'pending';
        break;
      case 'Cancelled':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'pending';
    }

    // Update billing record
    billingRecord.status = newStatus;
    if (paymentDate) {
      billingRecord.paymentDate = paymentDate;
    }
    await billingRecord.save();

    console.log(`Updated billing record ${billingRecord._id} status to: ${newStatus}`);

    // If payment is successful, activate the subscription
    if (status === 'Successful') {
      const subscription = await Subscription.findById(billingRecord.subscriptionId);
      if (subscription) {
        subscription.status = 'active';
        subscription.lastPaymentDate = new Date();
        await subscription.save();
        
        console.log(`✅ Subscription ${subscription._id} activated after successful payment via webhook`);
      } else {
        console.error(`❌ Subscription not found for billing record: ${billingRecord._id}`);
      }
    } else if (status === 'Failed' || status === 'Cancelled') {
      // If payment failed or was cancelled, ensure subscription remains inactive
      const subscription = await Subscription.findById(billingRecord.subscriptionId);
      if (subscription && subscription.status === 'active') {
        subscription.status = 'pending';
        await subscription.save();
        
        console.log(`⚠️ Subscription ${subscription._id} deactivated after failed payment via webhook`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      transactionId,
      status,
      billingRecordId: billingRecord._id
    });

  } catch (error) {
    console.error('Lipila webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Lipila webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}