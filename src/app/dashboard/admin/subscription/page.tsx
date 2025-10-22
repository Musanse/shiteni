'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Crown,
  Zap
} from 'lucide-react';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  vendorType: 'hotel' | 'store' | 'pharmacy' | 'bus';
  planType: 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxProducts: number;
  maxStorage: number; // in GB
  maxStaffAccounts: number;
  status: 'active' | 'inactive' | 'archived';
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  amount: number;
  billingCycle: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  plan: {
    name: string;
    price: number;
  };
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showEditSubscriptionForm, setShowEditSubscriptionForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vendorType: 'hotel',
    planType: 'basic',
    price: '',
    currency: 'ZMW',
    billingCycle: 'monthly',
    features: '',
    maxProducts: '',
    maxStaffAccounts: '',
    isPopular: false,
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [plansResponse, subscriptionsResponse] = await Promise.all([
        fetch('/api/admin/subscription-plans'),
        fetch('/api/admin/subscription/subscriptions')
      ]);
      
      const plansData = await plansResponse.json();
      const subscriptionsData = await subscriptionsResponse.json();
      
      if (plansData.plans) {
        // Transform plans to match frontend interface
        const transformedPlans = plansData.plans.map((plan: any) => ({
          ...plan,
          maxProducts: plan.maxLoans || plan.maxProducts || 0, // Map maxLoans to maxProducts
          status: plan.isActive ? 'active' : 'inactive' // Map isActive to status
        }));
        setPlans(transformedPlans || []);
      }
      
      if (subscriptionsData.success) {
        setSubscriptions(subscriptionsData.subscriptions || []);
      }
      
      if (!plansData.plans && !subscriptionsData.success) {
        setError('Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanStatusChange = async (planId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/subscription/plans/${planId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPlans(plans.map(plan => 
          plan._id === planId 
            ? { ...plan, status: newStatus as any }
            : plan
        ));
      } else {
        setError(data.error || 'Failed to update plan status');
      }
    } catch (error) {
      console.error('Error updating plan status:', error);
      setError('Failed to update plan status');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse features from comma-separated string
      const features = formData.features
        .split(',')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      const planData = {
        name: formData.name,
        description: formData.description,
        vendorType: formData.vendorType,
        planType: formData.planType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        features: features,
        maxProducts: parseInt(formData.maxProducts) || 10,
        maxStaffAccounts: parseInt(formData.maxStaffAccounts) || 2,
        isPopular: formData.isPopular,
        isActive: formData.isActive
      };

      const response = await fetch('/api/admin/subscription-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      const data = await response.json();

      if (response.ok && data.plan) {
        // Add the new plan to the list with proper transformation
        const newPlan = {
          _id: data.plan._id,
          name: data.plan.name,
          description: data.plan.description,
          vendorType: data.plan.vendorType,
          planType: data.plan.planType,
          price: data.plan.price,
          currency: data.plan.currency,
          billingCycle: data.plan.billingCycle,
          features: data.plan.features,
          maxUsers: data.plan.maxUsers,
          maxProducts: data.plan.maxLoans, // API uses maxLoans field
          maxStorage: data.plan.maxStorage,
          maxStaffAccounts: data.plan.maxStaffAccounts,
          status: data.plan.isActive ? 'active' : 'inactive',
          isPopular: data.plan.isPopular,
          sortOrder: data.plan.sortOrder,
          createdAt: data.plan.createdAt,
          updatedAt: data.plan.updatedAt
        };
        setPlans([...plans, newPlan]);
        
        // Reset form and close modal
        setFormData({
          name: '',
          description: '',
          vendorType: 'hotel',
          planType: 'basic',
          price: '',
          currency: 'ZMW',
          billingCycle: 'monthly',
          features: '',
          maxProducts: '',
          maxStaffAccounts: '',
          isPopular: false,
          isActive: true
        });
        setShowCreateForm(false);
      } else {
        setError(data.error || 'Failed to create subscription plan');
      }
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      setError('Failed to create subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      vendorType: plan.vendorType,
      planType: plan.planType,
      price: plan.price.toString(),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features.join(', '),
      maxProducts: plan.maxProducts.toString(),
      maxStaffAccounts: plan.maxStaffAccounts.toString(),
      isPopular: plan.isPopular,
      isActive: plan.status === 'active'
    });
    setShowEditForm(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse features from comma-separated string
      const features = formData.features
        .split(',')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      const planData = {
        name: formData.name,
        description: formData.description,
        vendorType: formData.vendorType,
        planType: formData.planType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        features: features,
        maxProducts: parseInt(formData.maxProducts) || 10,
        maxStaffAccounts: parseInt(formData.maxStaffAccounts) || 2,
        isPopular: formData.isPopular,
        isActive: formData.isActive
      };

      const response = await fetch(`/api/admin/subscription-plans/${editingPlan._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      const data = await response.json();

      if (response.ok && data.plan) {
        // Update the plan in the list
        setPlans(plans.map(plan => 
          plan._id === editingPlan._id 
            ? {
                ...plan,
                name: data.plan.name,
                description: data.plan.description,
                vendorType: data.plan.vendorType,
                planType: data.plan.planType,
                price: data.plan.price,
                currency: data.plan.currency,
                billingCycle: data.plan.billingCycle,
                features: data.plan.features,
                maxProducts: data.plan.maxLoans || data.plan.maxProducts,
                maxStaffAccounts: data.plan.maxStaffAccounts,
                status: data.plan.isActive ? 'active' : 'inactive',
                isPopular: data.plan.isPopular,
                updatedAt: data.plan.updatedAt
              }
            : plan
        ));
        
        // Reset form and close modal
        setFormData({
          name: '',
          description: '',
          vendorType: 'hotel',
          planType: 'basic',
          price: '',
          currency: 'ZMW',
          billingCycle: 'monthly',
          features: '',
          maxProducts: '',
          maxStaffAccounts: '',
          isPopular: false,
          isActive: true
        });
        setShowEditForm(false);
        setEditingPlan(null);
      } else {
        setError(data.error || 'Failed to update subscription plan');
      }
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      setError('Failed to update subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      vendorType: 'hotel',
      planType: 'basic',
      price: '',
      currency: 'ZMW',
      billingCycle: 'monthly',
      features: '',
      maxProducts: '',
      maxStaffAccounts: '',
      isPopular: false,
      isActive: true
    });
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowEditSubscriptionForm(true);
  };

  const handleUpdateSubscription = async (action: string, updateData?: any) => {
    if (!editingSubscription) return;
    
    try {
      const response = await fetch('/api/admin/subscription', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: editingSubscription._id,
          action: action,
          ...updateData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the subscription in the list
        setSubscriptions(subscriptions.map(sub => 
          sub._id === editingSubscription._id 
            ? { ...sub, ...data.subscription }
            : sub
        ));
        
        setShowEditSubscriptionForm(false);
        setEditingSubscription(null);
      } else {
        setError(data.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    }
  };

  const handleCancelSubscriptionEdit = () => {
    setShowEditSubscriptionForm(false);
    setEditingSubscription(null);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesVendorType = vendorTypeFilter === 'all' || plan.vendorType === vendorTypeFilter;
    return matchesSearch && matchesStatus && matchesVendorType;
  });

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('basic')) return <Users className="h-4 w-4 text-blue-600" />;
    if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('premium')) return <Star className="h-4 w-4 text-yellow-600" />;
    if (planName.toLowerCase().includes('enterprise')) return <Crown className="h-4 w-4 text-purple-600" />;
    return <Zap className="h-4 w-4 text-green-600" />;
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency?.toUpperCase()) {
      case 'ZMW':
        return 'K'; // Zambian Kwacha symbol
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return currency || '$';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">Manage subscription plans and user subscriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{plans.length}</span>
            <span className="text-muted-foreground">Plans</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              {plans.filter(p => p.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCurrencySymbol('ZMW')}{subscriptions
                .filter(s => s.status === 'active' && s.billingCycle === 'monthly')
                .reduce((sum, s) => sum + s.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From monthly plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCurrencySymbol('ZMW')}{subscriptions
                .filter(s => s.status === 'active' && s.billingCycle === 'yearly')
                .reduce((sum, s) => sum + s.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From yearly plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'plans'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          User Subscriptions
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage available subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={vendorTypeFilter}
                onChange={(e) => setVendorTypeFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Vendor Types</option>
                <option value="hotel">Hotel</option>
                <option value="store">Store</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="bus">Bus</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card key={plan._id} className={`relative ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlanIcon(plan.name)}
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      {getStatusBadge(plan.status)}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {plan.vendorType ? plan.vendorType.charAt(0).toUpperCase() + plan.vendorType.slice(1) : 'Unknown'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {plan.planType ? plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{getCurrencySymbol(plan.currency)}{plan.price}</div>
                        <div className="text-sm text-muted-foreground">per {plan.billingCycle}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Max Users:</span>
                          <span className="font-medium">{plan.maxUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Max Products:</span>
                          <span className="font-medium">{plan.maxProducts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage:</span>
                          <span className="font-medium">{plan.maxStorage}GB</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-medium">Features:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                          {plan.features.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{plan.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {plan.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlanStatusChange(plan._id, 'inactive')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Deactivate
                          </Button>
                        )}
                        {plan.status === 'inactive' && (
                          <Button
                            size="sm"
                            onClick={() => handlePlanStatusChange(plan._id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlans.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No plans found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No subscription plans have been created yet.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <Card>
          <CardHeader>
            <CardTitle>User Subscriptions</CardTitle>
            <CardDescription>View and manage user subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.user.firstName} {subscription.user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.plan.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getCurrencySymbol(subscription.currency || 'ZMW')}{subscription.amount}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subscription.billingCycle}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSubscription(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No subscriptions found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No user subscriptions found.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan for a specific vendor type (hotel, store, pharmacy, or bus)
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePlan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Basic Plan, Premium Plan"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="vendorType">Vendor Type *</Label>
                <Select value={formData.vendorType} onValueChange={(value) => handleInputChange('vendorType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="planType">Plan Type *</Label>
                <Select value={formData.planType} onValueChange={(value) => handleInputChange('planType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this plan includes"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZMW">ZMW (K)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <Select value={formData.billingCycle} onValueChange={(value) => handleInputChange('billingCycle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxProducts">Max Products/Rooms *</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  min="1"
                  value={formData.maxProducts}
                  onChange={(e) => handleInputChange('maxProducts', e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="maxStaffAccounts">Max Staff Accounts *</Label>
                <Input
                  id="maxStaffAccounts"
                  type="number"
                  min="1"
                  value={formData.maxStaffAccounts}
                  onChange={(e) => handleInputChange('maxStaffAccounts', e.target.value)}
                  placeholder="5"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features *</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="Enter features separated by commas (e.g., Basic booking management, Email support, Standard reports)"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separate multiple features with commas
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPopular">Mark as Popular Plan</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active Plan</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePlan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-name">Plan Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Basic Plan, Premium Plan"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-vendorType">Vendor Type *</Label>
                <Select value={formData.vendorType} onValueChange={(value) => handleInputChange('vendorType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-planType">Plan Type *</Label>
                <Select value={formData.planType} onValueChange={(value) => handleInputChange('planType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this plan includes..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZMW">ZMW</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-billingCycle">Billing Cycle *</Label>
                <Select value={formData.billingCycle} onValueChange={(value) => handleInputChange('billingCycle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="edit-isPopular">Popular Plan</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-features">Features *</Label>
              <Textarea
                id="edit-features"
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="Enter features separated by commas (e.g., Feature 1, Feature 2, Feature 3)"
                rows={3}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separate multiple features with commas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxProducts">Max Products</Label>
                <Input
                  id="edit-maxProducts"
                  type="number"
                  min="1"
                  value={formData.maxProducts}
                  onChange={(e) => handleInputChange('maxProducts', e.target.value)}
                  placeholder="10"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-maxStaffAccounts">Max Staff Accounts</Label>
                <Input
                  id="edit-maxStaffAccounts"
                  type="number"
                  min="1"
                  value={formData.maxStaffAccounts}
                  onChange={(e) => handleInputChange('maxStaffAccounts', e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Active Plan</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={showEditSubscriptionForm} onOpenChange={setShowEditSubscriptionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription status and settings
            </DialogDescription>
          </DialogHeader>
          
          {editingSubscription && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Subscription Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span>{editingSubscription.user.firstName} {editingSubscription.user.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span>{editingSubscription.plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={editingSubscription.status === 'active' ? 'default' : 'secondary'}>
                      {editingSubscription.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>ZMW {editingSubscription.amount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {editingSubscription.status !== 'active' && (
                    <Button 
                      onClick={() => handleUpdateSubscription('activate')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Activate
                    </Button>
                  )}
                  {editingSubscription.status === 'active' && (
                    <Button 
                      onClick={() => handleUpdateSubscription('suspend')}
                      variant="outline"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Suspend
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleUpdateSubscription('cancel')}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleUpdateSubscription('renew')}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Renew
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelSubscriptionEdit}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}