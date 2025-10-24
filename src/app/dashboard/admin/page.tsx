'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  Shield, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  Database,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import UserRegistrationTrendChart from '@/components/charts/user-registration-trend-chart';
import BusinessTypesDistributionChart from '@/components/charts/business-types-distribution-chart';
import RevenueByServiceChart from '@/components/charts/revenue-by-service-chart';
import OrderStatusDistributionChart from '@/components/charts/order-status-distribution-chart';
import PlatformGrowthChart from '@/components/charts/platform-growth-chart';

interface DashboardData {
  businessStats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    verified: number;
  };
  userStats: {
    total: number;
    customers: number;
    businessAdmins: number;
    staff: number;
    verified: number;
    pendingKyc: number;
  };
  ecommerceStats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    activeProducts: number;
    lowStockProducts: number;
  };
  platformStats: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalProducts: number;
    totalRooms: number;
    totalRoutes: number;
    totalBookings: number;
    totalRevenue: number;
  };
  systemHealth: {
    uptime: string;
    responseTime: string;
    activeUsers: number;
    totalTransactions: number;
    databaseStatus: string;
    apiStatus: string;
    lastBackup: string;
    version: string;
  };
  recentGrowth: {
    newUsers: number;
    newBusinesses: number;
    newProducts: number;
  };
  recentBusinesses: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    kycStatus: string;
    createdAt: string;
  }>;
  lastUpdated: string;
  charts: {
    userRegistrationTrend: Array<{
      _id: string;
      count: number;
    }>;
    businessTypesDistribution: Array<{
      _id: string;
      count: number;
    }>;
    revenueByService: Array<{
      _id: string;
      revenue: number;
      orders: number;
    }>;
    orderStatusDistribution: Array<{
      _id: string;
      count: number;
    }>;
    platformGrowth: Array<{
      _id: string;
      users: number;
      businesses: number;
    }>;
  };
}

// Mock data - fallback if API fails
const mockInstitutions = [
  {
    id: '1',
    name: 'First National Bank',
    licenseNumber: 'FNB-2024-001',
    status: 'approved',
    contactEmail: 'info@firstbank.com',
    totalLoans: 150,
    totalAmount: 2500000,
    approvalDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Community Credit Union',
    licenseNumber: 'CCU-2024-002',
    status: 'pending',
    contactEmail: 'contact@ccu.com',
    totalLoans: 0,
    totalAmount: 0,
    approvalDate: null,
  },
  {
    id: '3',
    name: 'Metro Bank',
    licenseNumber: 'MB-2024-003',
    status: 'suspended',
    contactEmail: 'admin@metrobank.com',
    totalLoans: 75,
    totalAmount: 1200000,
    approvalDate: '2024-01-10',
  },
];

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'customer',
    status: 'verified',
    kycStatus: 'verified',
    createdAt: '2024-01-20',
  },
  {
    id: '2',
    name: 'Bank Manager',
    email: 'manager@firstbank.com',
    role: 'institution',
    status: 'verified',
    kycStatus: 'verified',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    role: 'customer',
    status: 'pending',
    kycStatus: 'pending',
    createdAt: '2024-01-25',
  },
];

const mockSystemHealth = {
  uptime: '99.9%',
  responseTime: '120ms',
  activeUsers: 1250,
  totalTransactions: 15420,
  databaseStatus: 'healthy',
  apiStatus: 'operational',
  lastBackup: '2024-01-15T10:30:00Z',
  version: '1.0.0',
};

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      // Use mock data as fallback
      setDashboardData({
        businessStats: { total: 3, active: 2, pending: 1, suspended: 0, verified: 2 },
        userStats: { total: 3, customers: 2, businessAdmins: 1, staff: 0, verified: 2, pendingKyc: 1 },
        ecommerceStats: { totalProducts: 50, totalOrders: 25, totalRevenue: 15000, pendingOrders: 5, completedOrders: 20, activeProducts: 45, lowStockProducts: 3 },
        platformStats: { totalBusinesses: 3, activeBusinesses: 2, totalProducts: 50, totalRooms: 20, totalRoutes: 10, totalBookings: 30, totalRevenue: 25000 },
        systemHealth: mockSystemHealth,
        recentGrowth: { newUsers: 5, newBusinesses: 2, newProducts: 15 },
        recentBusinesses: mockUsers.filter(user => ['manager', 'admin', 'super_admin'].includes(user.role)).slice(0, 5),
        recentUsers: mockUsers.slice(0, 5),
        lastUpdated: new Date().toISOString(),
        charts: {
          userRegistrationTrend: [],
          businessTypesDistribution: [],
          revenueByService: [],
          orderStatusDistribution: [],
          platformGrowth: []
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
        <Database className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold">No Dashboard Data Available</h2>
        <p>Please ensure the backend is running and accessible.</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System oversight and platform management</p>
          {dashboardData.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
            </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.businessStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.businessStats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.userStats.verified} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {(dashboardData.platformStats.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Across all businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.systemHealth.uptime}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Registration Analytics
            </CardTitle>
            <CardDescription>Track user growth and registration trends</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.charts?.userRegistrationTrend?.length > 0 ? (
              <UserRegistrationTrendChart data={dashboardData.charts.userRegistrationTrend} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No user registration data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Types
            </CardTitle>
            <CardDescription>Distribution of business types on platform</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.charts?.businessTypesDistribution?.length > 0 ? (
              <BusinessTypesDistributionChart data={dashboardData.charts.businessTypesDistribution} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No business type data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue by Service
            </CardTitle>
            <CardDescription>Revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.charts?.revenueByService?.length > 0 ? (
              <RevenueByServiceChart data={dashboardData.charts.revenueByService} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Order Status
            </CardTitle>
            <CardDescription>Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.charts?.orderStatusDistribution?.length > 0 ? (
              <OrderStatusDistributionChart data={dashboardData.charts.orderStatusDistribution} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No order status data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Growth */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Growth Metrics
            </CardTitle>
            <CardDescription>Overall platform growth and user acquisition</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.charts?.platformGrowth?.length > 0 ? (
              <PlatformGrowthChart data={dashboardData.charts.platformGrowth} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No platform growth data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Platform management and oversight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/vendors'}>
              <Building2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Vendor Management</div>
                <div className="text-xs opacity-80">Approve & suspend vendors</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/users'}>
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">User Management</div>
                <div className="text-xs opacity-80">View all system users</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/staffs'}>
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Staff Management</div>
                <div className="text-xs opacity-80">Create & manage staff</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/subscription'}>
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Subscriptions</div>
                <div className="text-xs opacity-80">Manage plans & billing</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/statistics'}>
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Statistics</div>
                <div className="text-xs opacity-80">View real-time data</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-16" onClick={() => window.location.href = '/dashboard/admin/settings'}>
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Settings</div>
                <div className="text-xs opacity-80">System configuration</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Registry</CardTitle>
            <CardDescription>Manage businesses on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {business.status === 'verified' && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {business.status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                        {business.status === 'suspended' && <AlertCircle className="h-3 w-3 text-red-500" />}
                        <span className="capitalize">{business.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize px-2 py-1 bg-muted rounded text-xs">
                        {business.role}
                      </span>
                    </TableCell>
                    <TableCell>{business.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-500" />
                <span className="font-medium">API Status</span>
              </div>
              <span className="text-green-500 font-medium capitalize">{dashboardData.systemHealth.apiStatus}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="font-medium">Database</span>
              </div>
              <span className="text-green-500 font-medium capitalize">{dashboardData.systemHealth.databaseStatus}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Response Time</span>
              </div>
              <span className="font-medium">{dashboardData.systemHealth.responseTime}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Active Users</span>
              </div>
              <span className="font-medium">{dashboardData.systemHealth.activeUsers.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Total Transactions</span>
              </div>
              <span className="font-medium">{dashboardData.systemHealth.totalTransactions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Platform users and their verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize px-2 py-1 bg-muted rounded text-xs">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.kycStatus === 'verified' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {user.kycStatus === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                      <span className="capitalize">{user.kycStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Center */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Center</CardTitle>
          <CardDescription>KYC/AML monitoring and compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-500">{dashboardData.userStats.verified}</div>
              <div className="text-sm text-muted-foreground">Verified Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">{dashboardData.userStats.pendingKyc}</div>
              <div className="text-sm text-muted-foreground">Pending KYC</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{dashboardData.businessStats.active}</div>
              <div className="text-sm text-muted-foreground">Active Businesses</div>
            </div>
          </div>
          
          {/* Growth Metrics */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-4">Recent Growth (Last 30 Days)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{dashboardData.recentGrowth.newUsers}</div>
                <div className="text-xs text-muted-foreground">New Users</div>
              </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{dashboardData.recentGrowth.newBusinesses}</div>
              <div className="text-xs text-muted-foreground">New Businesses</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{dashboardData.recentGrowth.newProducts}</div>
              <div className="text-xs text-muted-foreground">New Products</div>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
