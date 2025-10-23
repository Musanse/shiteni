'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Star, Zap, Crown, CreditCard, Calendar, Users, Package, Download } from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  planType: 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxProducts: number;
  maxStorage: number;
  maxStaffAccounts: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planType: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
  billingCycle: string;
  features: string[];
  maxUsers: number;
  maxProducts: number;
  maxStorage: number;
  maxStaffAccounts: number;
  paymentMethod: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StoreSubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [mobileMoneyContact, setMobileMoneyContact] = useState({
    phoneNumber: ''
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPaymentWaiting, setShowPaymentWaiting] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'error'>('pending');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  // Payment monitoring effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (showPaymentWaiting && paymentTransactionId && paymentStatus === 'pending') {
      console.log('Starting payment monitoring for transaction:', paymentTransactionId);
      
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/store/subscription/payment-status?transactionId=${paymentTransactionId}`);
          const data = await response.json();

          console.log('Payment status check:', data);

          if (data.success) {
            if (data.status === 'success') {
              setPaymentStatus('success');
              setShowPaymentWaiting(false);
              // Refresh subscription data
              await fetchSubscriptionData();
              // Show success message
              setErrorMessage('Payment successful! Your subscription has been activated.');
              setShowErrorModal(true);
            } else if (data.status === 'failed') {
              setPaymentStatus('failed');
              setShowPaymentWaiting(false);
              setErrorMessage(data.message || 'Payment failed. Please try again.');
              setShowErrorModal(true);
            }
            // If still pending, continue monitoring
          } else {
            setPaymentStatus('error');
            setShowPaymentWaiting(false);
            setErrorMessage(data.message || 'Error checking payment status.');
            setShowErrorModal(true);
          }
        } catch (error) {
          console.error('Error monitoring payment:', error);
          // Continue monitoring on error (might be temporary network issue)
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showPaymentWaiting, paymentTransactionId, paymentStatus]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch current subscription
      const subscriptionResponse = await fetch('/api/store/subscription');
      const subscriptionData = await subscriptionResponse.json();
      
      if (subscriptionData.success) {
        setSubscription(subscriptionData.subscription);
      }

      // Fetch available subscription plans
      const plansResponse = await fetch('/api/store/subscription-plans');
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        setPlans(plansData.plans);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const handleCloseDialog = () => {
    setShowUpgradeDialog(false);
    setMobileMoneyContact({ phoneNumber: '' });
  };

  const handleLipilaPayment = async () => {
    if (!selectedPlan) return;
    
    // Validate mobile money contact details
    if (!mobileMoneyContact.phoneNumber.trim()) {
      setErrorMessage('Please enter your mobile money phone number');
      setShowErrorModal(true);
      return;
    }

    if (!mobileMoneyContact.phoneNumber.match(/^0[0-9]{9}$/)) {
      setErrorMessage('Please enter a valid Zambian phone number (e.g., 0977123456)');
      setShowErrorModal(true);
      return;
    }
    
    setPaymentProcessing(true);
    try {
      const response = await fetch('/api/store/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod: 'lipila_mobile_money',
          mobileMoneyContact: mobileMoneyContact
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show waiting screen and start monitoring
        setPaymentTransactionId(data.transactionId);
        setPaymentStatus('pending');
        setShowPaymentWaiting(true);
        setShowUpgradeDialog(false);
        // Reset form
        setMobileMoneyContact({ phoneNumber: '' });
      } else {
        setErrorMessage(data.error || 'Failed to initiate payment');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Payment failed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // Mock cancellation - in real implementation, this would call an API
      if (subscription) {
        setSubscription({
          ...subscription,
          status: 'cancelled',
          autoRenew: false
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active', color: 'bg-green-500' },
      expired: { variant: 'destructive' as const, label: 'Expired', color: 'bg-red-500' },
      cancelled: { variant: 'secondary' as const, label: 'Cancelled', color: 'bg-gray-500' },
      pending: { variant: 'outline' as const, label: 'Pending', color: 'bg-yellow-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Package className="w-6 h-6" />;
      case 'premium':
        return <Star className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Please sign in to view subscription</p>
          <p className="text-sm text-gray-400">You need to be logged in as a store manager to access subscription information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-gray-600">Manage your store subscription plan</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading subscription data...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {/* Current Subscription */}
          {subscription ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(subscription.planType)}
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  Your current subscription details and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{subscription.planName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(subscription.status)}
                        {subscription.autoRenew && (
                          <Badge variant="outline">Auto-renewal enabled</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Billing Cycle:</span>
                        <span className="font-medium">Monthly</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{subscription.currency} {subscription.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-medium capitalize">{subscription.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Billing:</span>
                        <span className="font-medium">
                          {format(new Date(subscription.nextBillingDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Subscription Period</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Started:</span>
                          <span>{format(new Date(subscription.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{format(new Date(subscription.endDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowUpgradeDialog(true)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                      {subscription.status === 'active' && (
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelSubscription}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  No Active Subscription
                </CardTitle>
                <CardDescription>
                  You don't have an active subscription. Choose a plan below to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select a subscription plan to unlock all store features</p>
                  <Button onClick={() => setShowUpgradeDialog(true)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Choose Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Choose the plan that best fits your store's needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-2">
                        {getPlanIcon(plan.planType)}
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{plan.currency} {plan.price.toFixed(2)}</span>
                        <span className="text-gray-500">/{plan.billingCycle}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{plan.maxStaffAccounts === -1 ? 'Unlimited' : plan.maxStaffAccounts} staff accounts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4" />
                          <span>{plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts} products</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Features:</h4>
                        <ul className="space-y-1 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        variant={plan.isPopular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan)}
                        disabled={subscription?.planId === plan.id}
                      >
                        {subscription?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Dialog */}
          <Dialog open={showUpgradeDialog} onOpenChange={handleCloseDialog}>
            <DialogContent className="bg-bush-green border-bush-green">
              <DialogHeader>
                <DialogTitle className="text-white">Upgrade to {selectedPlan?.name}</DialogTitle>
                <DialogDescription className="text-gray-200">
                  Confirm your plan upgrade and billing details
                </DialogDescription>
              </DialogHeader>
              {selectedPlan && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <h3 className="font-semibold mb-2 text-gray-900">Plan Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Plan:</span>
                        <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Price:</span>
                        <span className="font-medium text-gray-900">{selectedPlan.currency} {selectedPlan.price.toFixed(2)}/{selectedPlan.billingCycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Staff Accounts:</span>
                        <span className="font-medium text-gray-900">{selectedPlan.maxStaffAccounts === -1 ? 'Unlimited' : selectedPlan.maxStaffAccounts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Products:</span>
                        <span className="font-medium text-gray-900">{selectedPlan.maxProducts === -1 ? 'Unlimited' : selectedPlan.maxProducts}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-gray-900">Enter Mobile Number</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={mobileMoneyContact.phoneNumber}
                          onChange={(e) => setMobileMoneyContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="e.g., 0977123456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bush-green focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">We'll automatically detect your mobile network</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCloseDialog} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                      Cancel
                    </Button>
                    <Button onClick={handleLipilaPayment} className="bg-white text-bush-green hover:bg-gray-50 border border-white" disabled={paymentProcessing}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {paymentProcessing ? 'Processing...' : 'Pay with Mobile Money'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Custom Error Modal */}
          <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
            <DialogContent className="bg-red-50 border-red-200">
              <DialogHeader>
                <DialogTitle className="text-red-800">Payment Status</DialogTitle>
                <DialogDescription className="text-red-600">
                  Payment processing result
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-red-700">{errorMessage}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowErrorModal(false)} className="bg-red-600 hover:bg-red-700 text-white">
                  OK
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Payment Waiting Screen */}
          <Dialog open={showPaymentWaiting} onOpenChange={() => {}}>
            <DialogContent className="bg-blue-50 border-blue-200 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-blue-800 text-center">Processing Payment</DialogTitle>
                <DialogDescription className="text-blue-600 text-center">
                  Please wait while we process your payment
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 text-center">
                <div className="mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">Payment Status: {paymentStatus.toUpperCase()}</p>
                  <p className="text-blue-600 text-sm">
                    Please check your mobile money for payment prompt
                  </p>
                  <p className="text-blue-500 text-xs">
                    Transaction ID: {paymentTransactionId.substring(0, 8)}...
                  </p>
                </div>
                <div className="mt-4 text-xs text-blue-500">
                  <p>⏱️ This may take up to 2 minutes</p>
                  <p>🔄 Checking payment status automatically...</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPaymentWaiting(false);
                    setPaymentStatus('pending');
                    setPaymentTransactionId('');
                  }}
                  className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Cancel Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
