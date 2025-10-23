'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  AlertTriangle, 
  Lock, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionGateProps {
  serviceType: 'hotel' | 'bus' | 'pharmacy' | 'store';
  children: React.ReactNode;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: any;
  error: string | null;
  vendorApproved: boolean;
  vendorStatus: string;
}

const formatCurrency = (amount: number, currency: string = 'ZMW') => {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-ZM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getServiceTypeDisplay = (serviceType: string) => {
  switch (serviceType) {
    case 'hotel': return 'Hotel';
    case 'bus': return 'Bus';
    case 'pharmacy': return 'Pharmacy';
    case 'store': return 'Store';
    default: return 'Service';
  }
};

export default function SubscriptionGate({ serviceType, children }: SubscriptionGateProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [serviceType]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      
      console.log(`[SubscriptionGate] Checking subscription for ${serviceType}`);
      
      // Check both subscription status and vendor approval status
      const [subscriptionResponse, vendorResponse] = await Promise.all([
        fetch(`/api/${serviceType}/subscription/status`),
        fetch('/api/vendor/approval-status')
      ]);
      
      const subscriptionData = await subscriptionResponse.json();
      const vendorData = await vendorResponse.json();
      
      console.log('[SubscriptionGate] Subscription data:', subscriptionData);
      console.log('[SubscriptionGate] Vendor data:', vendorData);
      console.log('[SubscriptionGate] Has active subscription:', subscriptionData.hasActiveSubscription);
      
      setSubscriptionStatus({
        hasActiveSubscription: subscriptionData.hasActiveSubscription,
        subscription: subscriptionData.subscription,
        error: subscriptionData.error,
        vendorApproved: vendorData.approved || false,
        vendorStatus: vendorData.status || 'pending'
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        error: 'Failed to check subscription status',
        vendorApproved: false,
        vendorStatus: 'unknown'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    router.push(`/dashboard/vendor/${serviceType}/subscription`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking vendor approval and subscription status...</p>
        </div>
      </div>
    );
  }

  // First check if vendor is approved
  if (!subscriptionStatus?.vendorApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Vendor Approval Required
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Your vendor account is pending approval from our admin team
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Current Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 text-sm">
                  Status: {subscriptionStatus?.vendorStatus?.charAt(0).toUpperCase() + subscriptionStatus?.vendorStatus?.slice(1)}
                </span>
              </div>
              <p className="text-yellow-700 mt-1 text-sm">
                Your {getServiceTypeDisplay(serviceType)} vendor account is currently under review.
              </p>
            </div>

            {/* What's Blocked */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">While waiting for approval, you cannot:</h3>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Subscribe to any plans</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Access dashboard features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Receive bookings or orders</span>
                </li>
              </ul>
            </div>

            {/* What happens after approval */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">After approval, you will be able to:</h3>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Subscribe to plans and access dashboard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Receive bookings and orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Manage your business operations</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                size="sm"
              >
                Back to Dashboard
              </Button>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              <strong>Note:</strong> Approval typically takes 1-2 business days. You will receive an email notification once your account is approved.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If vendor is approved but no active subscription
  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Subscription Required
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              You need an active subscription to access your {getServiceTypeDisplay(serviceType)} dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Current Status */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 text-sm">No Active Subscription</span>
              </div>
              <p className="text-red-700 mt-1 text-sm">
                Your {getServiceTypeDisplay(serviceType)} services are currently offline and not visible to customers.
              </p>
            </div>

            {/* What's Blocked */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">Without an active subscription, you cannot:</h3>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Access dashboard features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Receive bookings or orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Manage your business operations</span>
                </li>
              </ul>
            </div>

            {/* Benefits of Subscription */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">With an active subscription, you can:</h3>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Access all dashboard features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Receive bookings and orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Manage your business operations</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={handleSubscribe}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                size="sm"
              >
                Back to Dashboard
              </Button>
            </div>

            {/* Subscription Info */}
            {subscriptionStatus?.subscription && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Current Subscription Details:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`ml-2 ${
                      subscriptionStatus.subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subscriptionStatus.subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(subscriptionStatus.subscription.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If subscription is active, render the children
  return <>{children}</>;
}
