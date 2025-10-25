'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Smartphone, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface PaymentModalProps {
  subscription: {
    _id: string;
    planName: string;
    planType: string;
    amount: number;
    currency: string;
    billingCycle: string;
  } | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
  isNewSubscription?: boolean;
}

interface CustomerInfo {
  fullName: string;
  phoneNumber: string;
  email: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerCity?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerZip?: number;
  // Card details
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolderName?: string;
}

export default function PaymentModal({ subscription, onClose, onPaymentSuccess, isNewSubscription = false }: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'mobile-money' | 'card'>('mobile-money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [transactionId, setTransactionId] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    phoneNumber: '',
    email: '',
    customerFirstName: '',
    customerLastName: '',
    customerCity: '',
    customerCountry: 'Zambia',
    customerAddress: '',
    customerZip: undefined,
    // Card details
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  });

  const handleInputChange = (field: keyof CustomerInfo, value: string | number) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayment = async () => {
    if (!subscription) {
      setError('Subscription information is missing');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setPaymentStatus('pending');

      // Validate required fields
      if (!customerInfo.phoneNumber) {
        throw new Error('Phone number is required');
      }

      if (paymentType === 'card') {
        if (!customerInfo.customerFirstName || !customerInfo.customerLastName) {
          throw new Error('First name and last name are required for card payments');
        }
        if (!customerInfo.cardNumber || !customerInfo.expiryDate || !customerInfo.cvv || !customerInfo.cardHolderName) {
          throw new Error('Card number, expiry date, CVV, and card holder name are required for card payments');
        }
      }

      const response = await fetch(isNewSubscription ? '/api/institution/subscription/create' : '/api/institution/subscription/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isNewSubscription ? { planId: subscription._id } : { subscriptionId: subscription._id }),
          paymentType,
          customerInfo,
          narration: `Payment for ${subscription.planName} - ${subscription.billingCycle}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setTransactionId(data.payment.transactionId);
      
      // Handle different payment responses
      if (data.payment.status === 'Successful') {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      } else if (data.payment.redirectUrl) {
        // Card payment requires redirect - subscription remains pending until payment confirmed
        setRedirectUrl(data.payment.redirectUrl);
        setPaymentStatus('pending');
        console.log('Card payment initiated - subscription will be activated after payment confirmation');
      } else {
        // Mobile money payment is pending - subscription remains pending until payment confirmed
        setPaymentStatus('pending');
        console.log('Mobile money payment initiated - subscription will be activated after payment confirmation');
        // Poll for status updates
        pollPaymentStatus(data.payment.transactionId);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('Payment error:', error);
      
      // Provide more specific error messages for common issues
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Token generation failed')) {
        userFriendlyMessage = 'Payment processing is temporarily unavailable. Please try again in a few minutes or contact support if the issue persists.';
      } else if (errorMessage.includes('Authentication failed')) {
        userFriendlyMessage = 'Payment service authentication failed. Please contact support.';
      } else if (errorMessage.includes('Invalid payment amount')) {
        userFriendlyMessage = 'Please check the payment amount and try again.';
      } else if (errorMessage.includes('Invalid phone number')) {
        userFriendlyMessage = 'Please enter a valid phone number (e.g., 0971234567 or 260971234567).';
      } else if (errorMessage.includes('Server error')) {
        userFriendlyMessage = 'Payment service is experiencing issues. Please try again later.';
      } else if (errorMessage.includes('Service temporarily unavailable')) {
        userFriendlyMessage = 'Payment service is temporarily down. Please try again in a few minutes.';
      }
      
      setError(userFriendlyMessage);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = (txnId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      // Stop polling if we're no longer in pending state
      if (paymentStatus !== 'pending') {
        console.log('Stopping payment polling - no longer pending');
        return;
      }

      try {
        console.log(`Polling payment status (attempt ${attempts + 1}/${maxAttempts}) for transaction: ${txnId}`);
        const response = await fetch(`/api/institution/subscription/payment/status?transactionId=${txnId}`);
        const data = await response.json();

        console.log('Payment status response:', data);

        // Handle definitive payment states - STOP POLLING
        if (data.status === 'Successful') {
          console.log('✅ Payment confirmed successful - STOPPING POLLING');
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentSuccess();
            onClose();
          }, 2000);
          return; // Exit polling loop
        }

        if (data.status === 'Failed') {
          console.log('❌ Payment confirmed failed - STOPPING POLLING');
          setPaymentStatus('failed');
          setError(data.message || 'Payment failed');
          return; // Exit polling loop
        }

        if (data.status === 'Cancelled') {
          console.log('🚫 Payment was cancelled by user - STOPPING POLLING');
          setPaymentStatus('failed');
          setError('Payment was cancelled');
          return; // Exit polling loop
        }

        // Only continue polling if status is still Pending
        if (data.status === 'Pending') {
          console.log('⏳ Payment still pending, continuing to poll...');
          attempts++;
          
          if (attempts < maxAttempts && paymentStatus === 'pending') {
            console.log(`Will retry in 10 seconds... (${attempts}/${maxAttempts})`);
            pollingTimeoutRef.current = setTimeout(poll, 10000); // Poll every 10 seconds
          } else if (attempts >= maxAttempts) {
            console.log('⏰ Payment polling timeout reached - STOPPING POLLING');
            setPaymentStatus('failed');
            setError('Payment timeout - please check your mobile money or contact support');
          }
        } else {
          console.log('❓ Unknown payment status:', data.status, '- STOPPING POLLING');
          setPaymentStatus('failed');
          setError(`Unknown payment status: ${data.status}`);
        }
      } catch (error) {
        console.error('Status polling error:', error);
        attempts++;
        
        if (attempts < maxAttempts && paymentStatus === 'pending') {
          console.log(`Polling error, retrying in 10 seconds... (${attempts}/${maxAttempts})`);
          pollingTimeoutRef.current = setTimeout(poll, 10000);
        } else {
          console.log('❌ Max polling attempts reached due to errors - STOPPING POLLING');
          setPaymentStatus('failed');
          setError('Failed to verify payment status - please contact support');
        }
      }
    };

    // Start polling after 10 seconds
    pollingTimeoutRef.current = setTimeout(poll, 10000);
  };

  const handleRedirect = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };

  const handleCancelPayment = async () => {
    if (!transactionId) {
      setError('No transaction to cancel');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Stop polling immediately when user cancels
      if (pollingTimeoutRef.current) {
        console.log('🛑 Stopping payment polling due to user cancellation');
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }

      const response = await fetch('/api/institution/subscription/payment/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel payment');
      }

      console.log('Payment cancelled successfully:', data);
      setPaymentStatus('failed');
      setError('Payment was cancelled');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel payment';
      console.error('Cancel payment error:', error);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        console.log('🛑 Component unmounting - stopping payment polling');
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array to avoid HMR issues

  // Stop polling when payment status changes to non-pending
  useEffect(() => {
    if (paymentStatus !== 'pending' && pollingTimeoutRef.current) {
      console.log('🛑 Payment status changed to non-pending - stopping polling');
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, [paymentStatus]); // Remove pollingCleanup from dependencies

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {isNewSubscription ? 'Subscribe to Plan' : 'Payment Details'}
          </CardTitle>
          <CardDescription>
            {isNewSubscription ? 'Complete subscription for' : 'Complete payment for'} {subscription?.planName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-[#6F4E37] text-white p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span>{subscription?.planName}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing:</span>
                <span>{subscription?.billingCycle}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Amount:</span>
                <span>{subscription?.currency} {subscription?.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentType === 'mobile-money' ? 'default' : 'outline'}
                onClick={() => setPaymentType('mobile-money')}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile Money
              </Button>
              <Button
                variant={paymentType === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentType('card')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Card
              </Button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <Label>Customer Information</Label>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="260971042607"
                value={customerInfo.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={customerInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            {paymentType === 'card' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={customerInfo.customerFirstName || ''}
                      onChange={(e) => handleInputChange('customerFirstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={customerInfo.customerLastName || ''}
                      onChange={(e) => handleInputChange('customerLastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Lusaka"
                    value={customerInfo.customerCity || ''}
                    onChange={(e) => handleInputChange('customerCity', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={customerInfo.customerAddress || ''}
                    onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                  />
                </div>

                {/* Card Details Section */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-semibold mb-3 block">Card Details</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={customerInfo.cardNumber || ''}
                      onChange={(e) => {
                        // Format card number with spaces
                        const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                        handleInputChange('cardNumber', value);
                      }}
                      maxLength={19} // 16 digits + 3 spaces
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={customerInfo.expiryDate || ''}
                        onChange={(e) => {
                          // Format expiry date as MM/YY
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          handleInputChange('expiryDate', value);
                        }}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={customerInfo.cvv || ''}
                        onChange={(e) => {
                          // Only allow numbers, max 4 digits
                          const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                          handleInputChange('cvv', value);
                        }}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="cardHolderName">Card Holder Name *</Label>
                    <Input
                      id="cardHolderName"
                      type="text"
                      placeholder="John Doe"
                      value={customerInfo.cardHolderName || ''}
                      onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment Status */}
          {paymentStatus === 'pending' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              <span className="text-yellow-800">
                {redirectUrl ? 'Redirecting to payment...' : 'Processing payment...'}
              </span>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800">Payment successful!</span>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">{error || 'Payment failed'}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {paymentStatus === 'pending' && transactionId ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelPayment}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Payment
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                {redirectUrl ? (
                  <Button
                    onClick={handleRedirect}
                    className="flex-1 flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Complete Payment
                  </Button>
                ) : paymentStatus === 'failed' ? (
                  <Button
                    onClick={() => {
                      setError('');
                      setPaymentStatus('idle');
                      handlePayment();
                    }}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing || paymentStatus === 'success'}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `${isNewSubscription ? 'Subscribe' : 'Pay'} ${subscription?.currency} ${subscription?.amount.toLocaleString()}`
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Transaction ID */}
          {transactionId && (
            <div className="text-xs text-gray-500 text-center">
              Transaction ID: {transactionId}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
