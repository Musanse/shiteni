'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  Plus,
  Settings,
  Star,
  Crown,
  Zap
} from 'lucide-react';

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
  maxRooms: number;
  maxStorage: number;
  maxStaffAccounts: number;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planType: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
  billingCycle: string;
  features: string[];
  maxUsers: number;
  maxRooms: number;
  maxStorage: number;
  maxStaffAccounts: number;
  paymentMethod: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BillingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice: string;
  paymentMethod: string;
  transactionId: string;
  type: string;
}

export default function HotelSubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch subscription data from API
  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionData();
      fetchBillingHistory();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch current subscription and available plans in parallel
      const [subscriptionResponse, plansResponse] = await Promise.all([
        fetch('/api/hotel/subscription'),
        fetch('/api/hotel/subscription-plans')
      ]);

      // Handle subscription response
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.subscription);
      } else {
        console.warn('Failed to fetch subscription:', subscriptionResponse.status);
        setSubscription(null);
      }

      // Handle plans response
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.plans || []);
      } else {
        console.warn('Failed to fetch subscription plans:', plansResponse.status);
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscription(null);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setBillingLoading(true);
      
      const response = await fetch('/api/hotel/subscription/billing-history');
      
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.billingHistory || []);
      } else {
        console.warn('Failed to fetch billing history:', response.status);
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
      setBillingHistory([]);
    } finally {
      setBillingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const icons = {
      active: <CheckCircle className="h-3 w-3" />,
      expired: <XCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      pending: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1">{status.toUpperCase()}</span>
      </Badge>
    );
  };

  const getBillingStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      paid: <CheckCircle className="h-3 w-3" />,
      pending: <AlertCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      refunded: <XCircle className="h-3 w-3" />
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1">{status.toUpperCase()}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: currency || 'ZMW'
    }).format(amount);
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsUpgradeDialogOpen(true);
  };

  const handleCancelSubscription = () => {
    // Handle subscription cancellation
    console.log('Cancelling subscription...');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Subscription Management</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your subscription</p>
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-sm text-muted-foreground">
              To access subscription management, you need to be signed in as a hotel vendor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your hotel subscription and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Billing Settings
          </Button>
        </div>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Plan</Label>
                <p className="text-lg font-semibold">{subscription.planName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Amount</Label>
                <p className="text-lg font-semibold">{subscription.currency} {subscription.amount}/{subscription.billingCycle}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Next Billing</Label>
                <p className="text-lg font-semibold">{subscription.nextBillingDate}</p>
              </div>
            </div>

            <div className="mt-6">
              <Label className="text-sm text-muted-foreground mb-2">Plan Limits</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{subscription.maxRooms}</div>
                  <div className="text-xs text-muted-foreground">Max Rooms</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{subscription.maxStaffAccounts}</div>
                  <div className="text-xs text-muted-foreground">Max Staff</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{subscription.maxUsers}</div>
                  <div className="text-xs text-muted-foreground">Max Users</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{subscription.maxStorage}GB</div>
                  <div className="text-xs text-muted-foreground">Storage</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Label className="text-sm text-muted-foreground mb-2">Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => handleUpgrade(plans.find(p => p.id === 'enterprise')!)}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button variant="outline" onClick={handleCancelSubscription}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.isActive ? 'ring-2 ring-primary' : ''}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {plan.isActive && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  {plan.currency} {plan.price}
                  <span className="text-lg text-muted-foreground">/{plan.billingCycle}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="text-sm text-muted-foreground mb-2">Plan Limits</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Max Rooms:</span>
                      <span className="font-medium">{plan.maxRooms === -1 ? 'Unlimited' : plan.maxRooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Staff:</span>
                      <span className="font-medium">{plan.maxStaffAccounts === -1 ? 'Unlimited' : plan.maxStaffAccounts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Users:</span>
                      <span className="font-medium">{plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span className="font-medium">{plan.maxStorage}GB</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <Label className="text-sm text-muted-foreground">Features</Label>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full" 
                  variant={plan.isActive ? "outline" : "default"}
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.isActive}
                >
                  {plan.isActive ? 'Current Plan' : 'Upgrade to ' + plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {billingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : billingHistory.length > 0 ? (
            <div className="space-y-4">
              {billingHistory.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                    <Badge variant="secondary">{transaction.invoice}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</span>
                    {getBillingStatusBadge(transaction.status)}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No billing history found</p>
                <p className="text-sm">Your subscription transactions will appear here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Confirm your plan upgrade to {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <span className="text-2xl font-bold">{selectedPlan.currency} {selectedPlan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Billing Cycle</Label>
                <Select defaultValue={selectedPlan.billingCycle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">Payment Method</Label>
                <Select defaultValue="card">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit Card ending in 4242</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
