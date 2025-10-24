'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  RefreshCw, 
  Crown,
  Star,
  Zap,
  Shield,
  Users,
  Route,
  Bus,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface Subscription {
  _id: string;
  subscriptionId: string;
  planId: {
    _id: string;
    name: string;
    description: string;
    planType: 'basic' | 'premium' | 'enterprise';
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    features: string[];
    maxUsers: number;
    maxLoans: number;
    maxStorage: number;
    maxStaffAccounts: number;
  };
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  usage: {
    routes: number;
    buses: number;
    bookings: number;
    passengers: number;
    dispatches: number;
    staff: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlan {
  _id: string;
  planType: 'basic' | 'premium' | 'enterprise';
  planName: string;
  planDescription: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: Array<{
    name: string;
    description: string;
    included: boolean;
    limit?: number;
  }>;
  limits: {
    routes?: number;
    buses?: number;
    bookings?: number;
    passengers?: number;
    dispatches?: number;
    staff?: number;
  };
  isPopular?: boolean;
  sortOrder?: number;
}

export default function BusSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [upgrading, setUpgrading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    phoneNumber: ''
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bus/subscription');
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
        setSubscriptionHistory(data.subscriptionHistory);
        setAvailablePlans(data.availablePlans);
      } else {
        setError(data.error || 'Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    // Validate required fields
    if (paymentMethod === 'mobile_money' && !customerInfo.phoneNumber.trim()) {
      setError('Phone number is required for mobile money payment');
      return;
    }

    try {
      setUpgrading(true);
      setPaymentProcessing(true);
      
      // Prepare customer info for payment
      const paymentCustomerInfo = {
        phoneNumber: customerInfo.phoneNumber || '0971960353',
        email: 'd@gmail.com', // Use vendor's email
        name: 'Mwelwa Kelvin' // Use vendor's name
      };

      const response = await fetch('/api/bus/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan._id,
          paymentType: paymentMethod,
          customerInfo: paymentCustomerInfo
        })
      });

      const data = await response.json();

      console.log('🔍 API Response Debug:', {
        status: response.status,
        ok: response.ok,
        data: data,
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasError: 'error' in data,
        errorValue: data.error
      });

      if (data.success) {
        setPaymentData(data);
        setPaymentStatus('processing');
        setShowPaymentModal(true);
        setUpgradeModalOpen(false);
        
        // Start polling for payment status
        if (data.payment?.transactionId) {
          pollPaymentStatus(data.payment.transactionId);
        }
      } else {
        console.error('❌ API returned error:', data);
        setError(data.error || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setError('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
      setPaymentProcessing(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/bus/subscription/payment-status?transactionId=${transactionId}`);
        const data = await response.json();

        if (data.success) {
          if (data.payment.status === 'Successful' || data.payment.status === 'success') {
            setPaymentStatus('success');
            await fetchSubscription(); // Refresh subscription data
            setTimeout(() => {
              setShowPaymentModal(false);
              setError('');
            }, 3000);
            return;
          } else if (data.payment.status === 'Failed' || data.payment.status === 'failed' || 
                     data.payment.status === 'Cancelled' || data.payment.status === 'cancelled') {
            setPaymentStatus('failed');
            setTimeout(() => {
              setShowPaymentModal(false);
            }, 3000);
            return;
          }
          // Continue polling for 'Pending' status
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setPaymentStatus('timeout');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    poll();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic': return <Users className="h-5 w-5" />;
      case 'standard': return <Star className="h-5 w-5" />;
      case 'premium': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Shield className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic': return 'border-gray-200';
      case 'standard': return 'border-blue-200';
      case 'premium': return 'border-purple-200';
      case 'enterprise': return 'border-gold-200';
      default: return 'border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, limit?: number) => {
    if (!limit || limit === -1) return 0; // unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bus Subscription</h1>
          <p className="text-gray-600">Manage your bus service subscription and billing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSubscription} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setUpgradeModalOpen(true)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Current Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(subscription.planId.planType)}
              Current Subscription
            </CardTitle>
            <CardDescription>
              {subscription.planId.name} - {subscription.planId.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(subscription.status)}>
                  {getStatusIcon(subscription.status)}
                  <span className="ml-1 capitalize">{subscription.status}</span>
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-lg font-semibold">{formatCurrency(subscription.planId.price)}</p>
                <p className="text-sm text-gray-500">per {subscription.planId.billingCycle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="text-lg font-semibold">
                  {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Auto Renew</p>
                <p className="text-lg font-semibold">
                  {subscription.autoRenew ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </p>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <Route className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Routes</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.routes} / {subscription.planId.maxLoans === -1 ? '∞' : subscription.planId.maxLoans}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-blue-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.routes, subscription.planId.maxLoans))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.routes, subscription.planId.maxLoans)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <Bus className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Buses</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.buses} / {subscription.planId.maxUsers === -1 ? '∞' : subscription.planId.maxUsers}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-green-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.buses, subscription.planId.maxUsers))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.buses, subscription.planId.maxUsers)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Bookings</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.bookings} / {subscription.planId.maxStorage * 100 === -1 ? '∞' : subscription.planId.maxStorage * 100}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-purple-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.bookings, subscription.planId.maxStorage * 100))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.bookings, subscription.planId.maxStorage * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-medium">Passengers</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.passengers} / {subscription.planId.maxStorage * 1000 === -1 ? '∞' : subscription.planId.maxStorage * 1000}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-orange-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.passengers, subscription.planId.maxStorage * 1000))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.passengers, subscription.planId.maxStorage * 1000)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="font-medium">Dispatches</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.dispatches} / {subscription.planId.maxStorage * 50 === -1 ? '∞' : subscription.planId.maxStorage * 50}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-yellow-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.dispatches, subscription.planId.maxStorage * 50))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.dispatches, subscription.planId.maxStorage * 50)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="font-medium">Staff</p>
                  <p className="text-sm text-gray-600">
                    {subscription.usage.staff} / {subscription.planId.maxStaffAccounts === -1 ? '∞' : subscription.planId.maxStaffAccounts}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`bg-red-600 h-2 rounded-full ${getUsageColor(getUsagePercentage(subscription.usage.staff, subscription.planId.maxStaffAccounts))}`}
                      style={{ width: `${getUsagePercentage(subscription.usage.staff, subscription.planId.maxStaffAccounts)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>You don't have an active subscription. Choose a plan to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setUpgradeModalOpen(true)}>
              <Crown className="h-4 w-4 mr-2" />
              Choose a Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availablePlans.map((plan) => (
          <Card key={plan.planType} className={`${getPlanColor(plan.planType)} ${subscription?.planId?.planType === plan.planType ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(plan.planType)}
                {plan.planName}
              </CardTitle>
              <CardDescription>{plan.planDescription}</CardDescription>
              <div className="text-2xl font-bold">{formatCurrency(plan.price)}</div>
              <p className="text-sm text-gray-500">per {plan.billingCycle}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
                {plan.features.length > 5 && (
                  <p className="text-sm text-gray-500">+{plan.features.length - 5} more features</p>
                )}
              </div>
              <Button 
                className="w-full" 
                variant={subscription?.planId?.planType === plan.planType ? 'outline' : 'default'}
                disabled={subscription?.planId?.planType === plan.planType}
                onClick={() => {
                  setSelectedPlan(plan);
                  setUpgradeModalOpen(true);
                }}
              >
                {subscription?.planId?.planType === plan.planType ? 'Current Plan' : 'Choose Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Your recent subscription changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionHistory.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getPlanIcon(sub.planId?.planType || 'basic')}
                    <div>
                      <p className="font-medium">{sub.planId?.name || 'Unknown Plan'}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(sub.planId?.price || 0)} per {sub.planId?.billingCycle || 'monthly'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(sub.status)}>
                      {getStatusIcon(sub.status)}
                      <span className="ml-1 capitalize">{sub.status}</span>
                    </Badge>
                    <p className="text-sm text-gray-500">
                      {formatDate(sub.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
            <DialogDescription>
              Choose your new plan and billing preferences
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">{selectedPlan.planName}</h3>
                <p className="text-gray-600">{selectedPlan.planDescription}</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedPlan.price)} per {selectedPlan.billingCycle}</p>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number for Mobile Money */}
              {paymentMethod === 'mobile_money' && (
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0971960353"
                    value={customerInfo.phoneNumber}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your mobile money phone number
                  </p>
                </div>
              )}


              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpgrade} disabled={upgrading}>
                  {upgrading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Status Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Processing</DialogTitle>
            <DialogDescription>
              {paymentStatus === 'processing' && 'Please complete your payment...'}
              {paymentStatus === 'success' && 'Payment successful!'}
              {paymentStatus === 'failed' && 'Payment failed'}
              {paymentStatus === 'timeout' && 'Payment timeout'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-6">
            {paymentStatus === 'processing' && (
              <div className="space-y-4">
                <RefreshCw className="h-12 w-12 mx-auto animate-spin text-blue-600" />
                <div>
                  <p className="text-lg font-medium">Processing Payment</p>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === 'mobile_money' 
                      ? 'Please check your phone for payment prompt'
                      : 'Please complete payment on the next screen'
                    }
                  </p>
                </div>
                {paymentData?.payment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Amount: {formatCurrency(paymentData.payment.amount)}</p>
                    <p className="text-sm text-gray-600">Transaction ID: {paymentData.payment.transactionId}</p>
                  </div>
                )}
              </div>
            )}
            
            {paymentStatus === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="text-lg font-medium text-green-600">Payment Successful!</p>
                  <p className="text-sm text-gray-600">Your subscription has been activated</p>
                </div>
              </div>
            )}
            
            {paymentStatus === 'failed' && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-red-600" />
                <div>
                  <p className="text-lg font-medium text-red-600">Payment Failed</p>
                  <p className="text-sm text-gray-600">Please try again or contact support</p>
                </div>
              </div>
            )}
            
            {paymentStatus === 'timeout' && (
              <div className="space-y-4">
                <Clock className="h-12 w-12 mx-auto text-yellow-600" />
                <div>
                  <p className="text-lg font-medium text-yellow-600">Payment Timeout</p>
                  <p className="text-sm text-gray-600">Payment is taking longer than expected. Please check your subscription status.</p>
                </div>
              </div>
            )}
          </div>
          
          {paymentStatus === 'success' && (
            <div className="flex justify-end">
              <Button onClick={() => setShowPaymentModal(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}