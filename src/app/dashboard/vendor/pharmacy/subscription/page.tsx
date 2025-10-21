'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar,
  DollarSign,
  Users,
  Package,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionPlan {
  id: string;
  _id: string;
  name: string;
  description: string;
  vendorType: string;
  planType: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  maxUsers: number;
  maxProducts: number;
  maxStorage: number;
  maxStaffAccounts: number;
  status: string;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  _id: string;
  userId: string;
  planId: string;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PharmacySubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [showPaymentWaiting, setShowPaymentWaiting] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'canceled'>('pending');
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mobile-money' | 'card'>('mobile-money');
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    email: '',
    fullName: '',
    city: 'Lusaka',
    country: 'Zambia',
    address: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const [subscriptionResponse, plansResponse] = await Promise.all([
        fetch('/api/pharmacy/subscription'),
        fetch('/api/pharmacy/subscription-plans')
      ]);

      const subscriptionData = await subscriptionResponse.json();
      const plansData = await plansResponse.json();
      
      if (subscriptionData.success) {
        setSubscription(subscriptionData.subscription);
      }
      
      if (plansData.success) {
        setPlans(plansData.plans || []);
      }
      
      if (!subscriptionData.success && !plansData.success) {
        setError('Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    const plan = plans.find(p => (p.id || p._id) === planId);
    if (!plan) return;
    
    setSelectedPlan(plan);
    
    // Pre-fill payment details from session
    setPaymentDetails({
      phoneNumber: (session?.user as any)?.phoneNumber || '260977000000',
      email: session?.user?.email || '',
      fullName: `${(session?.user as any)?.firstName || ''} ${(session?.user as any)?.lastName || ''}`.trim() || 'Pharmacy Customer',
      city: 'Lusaka',
      country: 'Zambia',
      address: 'Pharmacy Address',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: ''
    });
    
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan) return;
    
    // Show custom payment confirmation modal instead of browser alert
    setShowPaymentConfirmation(true);
  };

  const confirmPayment = async () => {
    if (!selectedPlan) return;
    
    setShowPaymentConfirmation(false);
    setShowPaymentWaiting(true);
    setPaymentStatus('pending');
    
    try {
      const customerInfo = {
        phoneNumber: paymentDetails.phoneNumber,
        email: paymentDetails.email,
        fullName: paymentDetails.fullName,
        customerFirstName: paymentDetails.fullName.split(' ')[0] || 'Pharmacy',
        customerLastName: paymentDetails.fullName.split(' ').slice(1).join(' ') || 'Customer',
        customerCity: paymentDetails.city,
        customerCountry: paymentDetails.country,
        customerAddress: paymentDetails.address,
        customerZip: 10101,
        // Add card details for card payments
        ...(paymentMethod === 'card' && {
          cardNumber: paymentDetails.cardNumber,
          expiryDate: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv,
          cardName: paymentDetails.cardName
        })
      };

      const response = await fetch('/api/pharmacy/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: selectedPlan.id || selectedPlan._id,
          paymentType: paymentMethod,
          customerInfo
        }),
      });

      const data = await response.json();
      
      // Handle service unavailable (503) - API key issues
      if (response.status === 503) {
        setPaymentStatus('failed');
        setShowPaymentWaiting(false);
        setShowPaymentError(true);
        setErrorMessage('Payment service is currently unavailable. Please contact support or try again later.');
        setError('Payment service unavailable');
        return;
      }
      
      if (data.success) {
        setSubscription(data.subscription);
        setError(null);
        setIsPaymentModalOpen(false);
        setPaymentResponse(data.paymentResponse);
        
        // Start monitoring payment status
        if (data.paymentResponse?.transactionId) {
          startPaymentStatusMonitoring(data.paymentResponse.transactionId);
        } else {
          // If no transaction ID, assume immediate success for card payments
          if (paymentMethod === 'card') {
            setPaymentStatus('success');
            setShowPaymentWaiting(false);
            setShowPaymentSuccess(true);
          } else {
            setPaymentStatus('failed');
            setShowPaymentWaiting(false);
            setShowPaymentError(true);
            setErrorMessage('Payment transaction could not be initiated');
          }
        }
      } else {
        setError(data.error || 'Failed to upgrade subscription');
        setPaymentStatus('failed');
        setShowPaymentWaiting(false);
        setShowPaymentError(true);
        setErrorMessage(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setError('Failed to upgrade subscription');
      setPaymentStatus('failed');
      setShowPaymentWaiting(false);
      setShowPaymentError(true);
      
      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setErrorMessage('Network connection failed. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        setErrorMessage(`Payment failed: ${error.message}`);
      } else {
        setErrorMessage('Failed to upgrade subscription. Please try again.');
      }
    }
  };

  const startPaymentStatusMonitoring = (transactionId: string) => {
    // Clear any existing interval
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
    }

    // Start checking payment status every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pharmacy/subscription/payment-status?transactionId=${transactionId}`);
        const data = await response.json();
        
        if (data.success) {
          const status = data.paymentStatus?.toLowerCase();
          console.log(`🔍 Payment status check: ${status} for transaction ${transactionId}`);
          
          if (status === 'successful' || status === 'completed' || status === 'success') {
            setPaymentStatus('success');
            setShowPaymentWaiting(false);
            setShowPaymentSuccess(true);
            clearInterval(interval);
            setPaymentCheckInterval(null);
          } else if (status === 'failed' || status === 'error' || status === 'failure') {
            setPaymentStatus('failed');
            setShowPaymentWaiting(false);
            setShowPaymentError(true);
            setErrorMessage(data.message || 'Payment failed');
            clearInterval(interval);
            setPaymentCheckInterval(null);
          } else if (status === 'cancelled' || status === 'canceled' || status === 'cancel') {
            setPaymentStatus('canceled');
            setShowPaymentWaiting(false);
            setShowPaymentError(true);
            setErrorMessage('Payment was cancelled');
            clearInterval(interval);
            setPaymentCheckInterval(null);
          }
          // If still pending, continue monitoring
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Continue monitoring on error, don't fail immediately
      }
    }, 3000);

    setPaymentCheckInterval(interval);

    // Stop monitoring after 5 minutes (100 checks)
    setTimeout(() => {
      if (paymentStatus === 'pending') {
        setPaymentStatus('failed');
        setShowPaymentWaiting(false);
        setShowPaymentError(true);
        setErrorMessage('Payment timeout - please check your phone or try again');
        clearInterval(interval);
        setPaymentCheckInterval(null);
      }
    }, 300000); // 5 minutes
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
      }
    };
  }, [paymentCheckInterval]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      expired: 'destructive',
      cancelled: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency?.toUpperCase()) {
      case 'ZMW':
        return 'K';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return currency || 'K';
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view subscription</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy subscription plan</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Current Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Subscription</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold">{subscription.planName}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  {getStatusBadge(subscription.status)}
                  <span className="text-sm text-gray-500">
                    {subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {getCurrencySymbol(subscription.currency)}{subscription.amount}
                </div>
                <p className="text-sm text-gray-500">per {subscription.billingCycle}</p>
              </div>
              <div>
                <div className="text-sm text-gray-500">Next billing</div>
                <div className="font-medium">
                  {format(new Date(subscription.endDate), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-gray-500">
                  Auto-renew: {subscription.autoRenew ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-gray-500 mb-4">Choose a plan below to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card key={plan.id || plan._id || `plan-${index}`} className={`relative ${plan.isPopular ? 'border-blue-500' : ''}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {getCurrencySymbol(plan.currency)}{plan.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {plan.billingCycle}
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{plan.maxUsers} users</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{plan.maxProducts} medicines</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span>{plan.maxStaffAccounts} staff accounts</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={`${plan.id || plan._id || 'plan'}-feature-${featureIndex}`} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  variant={plan.isPopular ? 'default' : 'outline'}
                  onClick={() => handleUpgrade(plan.id || plan._id)}
                >
                  {subscription?.planId === (plan.id || plan._id) ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past and upcoming payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Current Period</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(subscription.startDate), 'MMM d')} - {format(new Date(subscription.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {getCurrencySymbol(subscription.currency)}{subscription.amount}
                  </div>
                  <div className="text-sm text-gray-500">{subscription.billingCycle}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-green-50 border-green-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-green-900 text-lg">Complete Subscription Payment</DialogTitle>
            <DialogDescription className="text-green-700 text-sm">
              Choose your payment method and enter your details to upgrade to {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-3">
              {/* Plan Summary - Compact */}
              <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 text-base">{selectedPlan.name}</h3>
                <p className="text-xs text-green-700">{selectedPlan.description}</p>
                <div className="mt-1 text-lg font-bold text-green-900">
                  {getCurrencySymbol(selectedPlan.currency)}{selectedPlan.price} per {selectedPlan.billingCycle}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-1">
                <Label htmlFor="payment-method" className="text-green-900 font-medium text-sm">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: 'mobile-money' | 'card') => setPaymentMethod(value)}>
                  <SelectTrigger className="bg-white border-green-300 focus:border-green-500 text-gray-900 h-9">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile-money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details Form - Compact */}
              <div className="space-y-2">
                {/* Basic Details - Grid Layout */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-green-900 font-medium text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="260XXXXXXXXX"
                      value={paymentDetails.phoneNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-green-900 font-medium text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={paymentDetails.email}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-green-900 font-medium text-sm">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={paymentDetails.fullName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, fullName: e.target.value }))}
                      className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                      required
                    />
                  </div>
                </div>

                {/* Card Details - Only show when card payment is selected */}
                {paymentMethod === 'card' && (
                  <div className="space-y-2 border-t border-green-200 pt-2">
                    <h4 className="font-semibold text-green-900 text-sm">Card Details</h4>
                    
                    <div className="space-y-1">
                      <Label htmlFor="cardNumber" className="text-green-900 font-medium text-sm">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                        required={paymentMethod === 'card'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="expiryDate" className="text-green-900 font-medium text-sm">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                          required={paymentMethod === 'card'}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cvv" className="text-green-900 font-medium text-sm">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                          required={paymentMethod === 'card'}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="cardName" className="text-green-900 font-medium text-sm">Name on Card</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="Name as it appears on card"
                        value={paymentDetails.cardName}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value }))}
                        className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                        required={paymentMethod === 'card'}
                      />
                    </div>
                  </div>
                )}

                {/* Address Details - Compact */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-green-900 font-medium text-sm">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Lusaka"
                      value={paymentDetails.city}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, city: e.target.value }))}
                      className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-green-900 font-medium text-sm">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="Zambia"
                      value={paymentDetails.country}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, country: e.target.value }))}
                      className="bg-white border-green-300 focus:border-green-500 text-gray-900 placeholder:text-gray-500 h-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Always visible */}
              <div className="flex space-x-2 pt-2 border-t border-green-200">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 bg-green-100 border-green-300 text-green-900 hover:bg-green-200 h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium h-9"
                  disabled={!paymentDetails.phoneNumber || !paymentDetails.email || !paymentDetails.fullName || 
                           (paymentMethod === 'card' && (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardName))}
                >
                  {paymentMethod === 'mobile-money' ? 'Send Mobile Money Request' : 'Process Card Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Modal */}
      <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <DialogContent className="sm:max-w-md bg-green-50 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-green-900">Confirm Payment</DialogTitle>
            <DialogDescription className="text-green-700">
              Please review your payment details before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900">Payment Summary</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-green-700">Plan:</span>
                    <span className="font-medium text-green-900">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-medium text-green-900">
                      {getCurrencySymbol(selectedPlan.currency)}{selectedPlan.price}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Method:</span>
                    <span className="font-medium text-green-900">
                      {paymentMethod === 'mobile-money' ? 'Mobile Money' : 'Card Payment'}
                    </span>
                  </div>
                  {paymentMethod === 'mobile-money' && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Phone:</span>
                      <span className="font-medium text-green-900">{paymentDetails.phoneNumber}</span>
                    </div>
                  )}
                  {paymentMethod === 'card' && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Card:</span>
                      <span className="font-medium text-green-900">****{paymentDetails.cardNumber.slice(-4)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  {paymentMethod === 'mobile-money' 
                    ? 'This will send a mobile money request to your phone. Please complete the payment to activate your subscription.'
                    : 'This will process your card payment immediately. Your subscription will be activated upon successful payment.'
                  }
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="flex-1 bg-green-100 border-green-300 text-green-900 hover:bg-green-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Waiting Modal */}
      <Dialog open={showPaymentWaiting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-green-50 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600 animate-spin" />
              Processing Payment...
            </DialogTitle>
            <DialogDescription className="text-green-700">
              Please wait while we process your payment. Do not close this window.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-center space-y-3">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-green-200 rounded-full mx-auto flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div>
                  <p className="text-green-800 font-medium">
                    {paymentMethod === 'mobile-money' ? '📱 Mobile Money Payment' : '💳 Card Payment'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {paymentMethod === 'mobile-money' 
                      ? `Payment request sent to ${paymentDetails.phoneNumber}. Please complete the payment on your phone.`
                      : 'Processing your card payment. Please wait...'
                    }
                  </p>
                </div>

                {paymentResponse?.transactionId && (
                  <div className="bg-white p-2 rounded border border-green-300">
                    <p className="text-xs text-green-600">Transaction ID:</p>
                    <p className="text-sm font-mono text-green-800">{paymentResponse.transactionId}</p>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>

                <p className="text-xs text-green-600">
                  This may take a few moments. Please do not close this window.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentWaiting(false);
                  if (paymentCheckInterval) {
                    clearInterval(paymentCheckInterval);
                    setPaymentCheckInterval(null);
                  }
                }}
                className="bg-green-100 border-green-300 text-green-900 hover:bg-green-200"
              >
                Cancel Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="sm:max-w-md bg-green-50 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-green-700">
              Your subscription payment has been processed successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-100 p-4 rounded-lg border border-green-200">
              <div className="space-y-2">
                {paymentStatus === 'success' && (
                  <>
                    {paymentMethod === 'mobile-money' ? (
                      <>
                        <p className="text-green-800 font-medium">📱 Mobile Money Payment Successful!</p>
                        <p className="text-sm text-green-700">
                          Payment completed on {paymentDetails.phoneNumber}
                        </p>
                        <p className="text-sm text-green-700">
                          Transaction ID: {paymentResponse?.transactionId || 'N/A'}
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                          Your subscription has been activated!
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-green-800 font-medium">💳 Card Payment Successful!</p>
                        <p className="text-sm text-green-700">
                          Payment processed successfully
                        </p>
                        <p className="text-sm text-green-700">
                          Transaction ID: {paymentResponse?.transactionId || 'N/A'}
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                          Your subscription has been activated!
                        </p>
                      </>
                    )}
                  </>
                )}
                
                {paymentStatus === 'canceled' && (
                  <>
                    <p className="text-orange-800 font-medium">⚠️ Payment Cancelled</p>
                    <p className="text-sm text-orange-700">
                      The payment was cancelled by the user
                    </p>
                    <p className="text-sm text-orange-700">
                      Transaction ID: {paymentResponse?.transactionId || 'N/A'}
                    </p>
                    <p className="text-sm text-orange-700 mt-2">
                      No charges were made to your account.
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowPaymentSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Error Modal */}
      <Dialog open={showPaymentError} onOpenChange={setShowPaymentError}>
        <DialogContent className="sm:max-w-md bg-red-50 border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Payment Failed
            </DialogTitle>
            <DialogDescription className="text-red-700">
              There was an issue processing your payment. Please try again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-100 p-4 rounded-lg border border-red-200">
              <div className="space-y-2">
                {paymentStatus === 'failed' && (
                  <>
                    <p className="text-red-800 font-medium">❌ Payment Failed</p>
                    <p className="text-sm text-red-700">
                      {errorMessage || 'Payment could not be processed. Please try again.'}
                    </p>
                    {paymentResponse?.transactionId && (
                      <p className="text-sm text-red-700">
                        Transaction ID: {paymentResponse.transactionId}
                      </p>
                    )}
                    <p className="text-sm text-red-700 mt-2">
                      Please check your payment details and try again.
                    </p>
                  </>
                )}
                
                {paymentStatus === 'canceled' && (
                  <>
                    <p className="text-orange-800 font-medium">⚠️ Payment Cancelled</p>
                    <p className="text-sm text-orange-700">
                      The payment was cancelled by the user
                    </p>
                    {paymentResponse?.transactionId && (
                      <p className="text-sm text-orange-700">
                        Transaction ID: {paymentResponse.transactionId}
                      </p>
                    )}
                    <p className="text-sm text-orange-700 mt-2">
                      No charges were made to your account.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentError(false)}
                className="flex-1 bg-red-100 border-red-300 text-red-900 hover:bg-red-200"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPaymentError(false);
                  setIsPaymentModalOpen(true);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
