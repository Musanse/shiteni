'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HomeIcon as Home, 
  CreditCardIcon as CreditCard, 
  DocumentTextIcon as FileText, 
  ChatBubbleLeftRightIcon as MessageSquare,
  ArrowPathIcon as RefreshCw,
  CircleStackIcon as Database,
  ExclamationCircleIcon as AlertCircleIcon,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
  ExclamationTriangleIcon as AlertTriangle,
  CurrencyDollarIcon as DollarSign,
  CalendarIcon as Calendar,
  ChartBarIcon as TrendingUp,
  ChartBarIcon as Activity,
  EyeIcon as Eye,
  ArrowDownTrayIcon as Download,
  ShoppingCartIcon as ShoppingCart,
  BuildingOffice2Icon as Building2,
  TruckIcon as Bus,
  ShoppingBagIcon as ShoppingBag,
  PillIcon as Pill
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  overview: {
    customerName: string;
    totalBookings: number;
    activeBookings: number;
    totalSpent: number;
    totalSavings: number;
    nextBookingDate?: string;
    nextBookingAmount?: number;
  };
  recentBookings: Array<{
    _id: string;
    serviceType: string;
    serviceName: string;
    amount: number;
    status: string;
    bookingDate: string;
    vendorName: string;
  }>;
  recentMessages: Array<{
    _id: string;
    senderName: string;
    content: string;
    timestamp: string;
    unread: boolean;
  }>;
}

export default function CustomerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setIsRealData(true);
      } else if (response.status === 401) {
        console.warn('Unauthorized - using mock data');
        setDashboardData(getMockDashboardData());
        setIsRealData(false);
      } else {
        console.error('Failed to fetch dashboard data:', response.statusText);
        setDashboardData(getMockDashboardData());
        setIsRealData(false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(getMockDashboardData());
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getMockDashboardData = (): DashboardData => ({
    overview: {
      customerName: 'John Doe',
      totalBookings: 8,
      activeBookings: 3,
      totalSpent: 2500,
      totalSavings: 150,
      nextBookingDate: '2024-02-15',
      nextBookingAmount: 120
    },
    recentBookings: [
      {
        _id: '1',
        serviceType: 'hotel',
        serviceName: 'Luxury Hotel Room',
        amount: 450,
        status: 'confirmed',
        bookingDate: '2024-01-15',
        vendorName: 'Grand Hotel Lusaka'
      },
      {
        _id: '2',
        serviceType: 'bus',
        serviceName: 'Bus Ticket to Livingstone',
        amount: 85,
        status: 'confirmed',
        bookingDate: '2024-01-20',
        vendorName: 'Zambia Express'
      },
      {
        _id: '3',
        serviceType: 'pharmacy',
        serviceName: 'Medicine Order',
        amount: 45,
        status: 'completed',
        bookingDate: '2024-01-22',
        vendorName: 'City Pharmacy'
      }
    ],
    recentMessages: [
      {
        _id: '1',
        senderName: 'Grand Hotel Lusaka',
        content: 'Your booking has been confirmed! Check-in details sent.',
        timestamp: '2024-01-25T10:30:00Z',
        unread: true
      },
      {
        _id: '2',
        senderName: 'Zambia Express',
        content: 'Your bus ticket is ready for download',
        timestamp: '2024-01-24T14:15:00Z',
        unread: false
      },
      {
        _id: '3',
        senderName: 'City Pharmacy',
        content: 'Your medicine order has been delivered',
        timestamp: '2024-01-23T09:45:00Z',
        unread: true
      }
    ]
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-800"><Activity className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'hotel': return <Building2 className="h-4 w-4" />;
      case 'bus': return <Bus className="h-4 w-4" />;
      case 'store': return <ShoppingBag className="h-4 w-4" />;
      case 'pharmacy': return <Pill className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircleIcon className="h-8 w-8 text-red-500" />
        <span className="ml-3 text-lg text-muted-foreground">Failed to load dashboard</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" />
            Welcome back, {dashboardData.overview?.customerName || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your bookings and activities</p>
          {isRealData ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                <Database className="w-3 h-3" />
                Live Data
              </div>
              <span className="text-sm text-green-600">Showing real data from database</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                <AlertCircleIcon className="w-3 h-3" />
                Demo Data
              </div>
              <span className="text-sm text-yellow-600">Please log in to see real data</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview?.activeBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.overview?.totalSpent || 0, 'ZMW')}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.overview?.totalSavings || 0, 'ZMW')}</div>
            <p className="text-xs text-muted-foreground">From discounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Booking Alert */}
      {dashboardData.overview?.nextBookingDate && dashboardData.overview?.nextBookingAmount && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Upcoming Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">
                  Booking date: {dashboardData.overview?.nextBookingDate ? new Date(dashboardData.overview.nextBookingDate).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-blue-600 text-sm">
                  Don&apos;t forget to check-in or arrive on time
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrency(dashboardData.overview?.nextBookingAmount || 0, 'ZMW')}
                </div>
                <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Your latest bookings and reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardData.recentBookings || []).length > 0 ? (
                (dashboardData.recentBookings || []).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(booking.serviceType)}
                        <div className="font-medium">{booking.serviceName}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vendorName} • {formatCurrency(booking.amount, 'ZMW')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Booked: {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings found</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View All Bookings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Latest communications from vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardData.recentMessages || []).length > 0 ? (
                (dashboardData.recentMessages || []).map((message) => (
                  <div key={message._id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {message.senderName.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{message.senderName}</div>
                        {message.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp ? new Date(message.timestamp).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent messages found</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Browse Products</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span>View Payments</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>Contact Support</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Download className="h-6 w-6" />
              <span>Download Receipts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}