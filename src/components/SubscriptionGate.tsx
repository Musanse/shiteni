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
      const response = await fetch(`/api/${serviceType}/subscription/status`);
      const data = await response.json();
      
      setSubscriptionStatus({
        hasActiveSubscription: data.hasActiveSubscription,
        subscription: data.subscription,
        error: data.error
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        error: 'Failed to check subscription status'
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
          <p className="mt-2 text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Subscription Required
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              You need an active subscription to access your {getServiceTypeDisplay(serviceType)} dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">No Active Subscription</span>
              </div>
              <p className="text-red-700 mt-1">
                Your {getServiceTypeDisplay(serviceType)} services are currently offline and not visible to customers.
              </p>
            </div>

            {/* What's Blocked */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Without an active subscription, you cannot:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Access dashboard features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Receive bookings or orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Manage your business operations</span>
                </li>
              </ul>
            </div>

            {/* Benefits of Subscription */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">With an active subscription, you can:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Access all dashboard features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Show your services/products to customers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Receive bookings and orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Manage your business operations</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSubscribe}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Subscribe Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                size="lg"
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
