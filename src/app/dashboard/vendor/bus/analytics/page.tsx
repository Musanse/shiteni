'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Bus, 
  Route,
  CreditCard,
  Smartphone,
  Banknote,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    onlineRevenue: number;
    walkInRevenue: number;
    dispatchRevenue: number;
    totalPassengers: number;
    onlinePassengers: number;
    walkInPassengers: number;
    totalTrips: number;
    activeTrips: number;
    revenueGrowth: number;
    passengerGrowth: number;
  };
  routes: {
    topRoutes: Array<{
      routeName: string;
      bookings: number;
      revenue: number;
      passengers: number;
    }>;
    totalRoutes: number;
  };
  buses: {
    topBuses: Array<{
      busName: string;
      trips: number;
      revenue: number;
      passengers: number;
    }>;
    totalBuses: number;
  };
  trends: {
    revenueTrend: Array<{
      date: string;
      revenue: number;
    }>;
    period: {
      startDate: string;
      endDate: string;
      days: number;
    };
  };
  paymentMethods: {
    card: number;
    mobile_money: number;
    cash: number;
    bank_transfer: number;
  };
  summary: {
    totalBookings: number;
    totalTickets: number;
    totalDispatches: number;
    completedBookings: number;
    activeTickets: number;
    arrivedDispatches: number;
  };
}

export default function BusAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (period) params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/bus/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Chart data preparation
  const paymentMethodData = analytics ? [
    { name: 'Card', value: analytics.paymentMethods.card, color: '#3b82f6' },
    { name: 'Mobile Money', value: analytics.paymentMethods.mobile_money, color: '#10b981' },
    { name: 'Cash', value: analytics.paymentMethods.cash, color: '#f59e0b' },
    { name: 'Bank Transfer', value: analytics.paymentMethods.bank_transfer, color: '#8b5cf6' }
  ].filter(item => item.value > 0) : [];

  const revenueBreakdownData = analytics ? [
    { name: 'Online Bookings', value: analytics.overview.onlineRevenue, color: '#3b82f6' },
    { name: 'Walk-in Tickets', value: analytics.overview.walkInRevenue, color: '#10b981' },
    { name: 'Parcel Dispatch', value: analytics.overview.dispatchRevenue, color: '#8b5cf6' }
  ].filter(item => item.value > 0) : [];

  const routePerformanceData = analytics ? analytics.routes.topRoutes.map((route, index) => ({
    name: route.routeName.length > 15 ? route.routeName.substring(0, 15) + '...' : route.routeName,
    fullName: route.routeName,
    revenue: route.revenue,
    passengers: route.passengers,
    bookings: route.bookings
  })) : [];

  const busPerformanceData = analytics ? analytics.buses.topBuses.map((bus, index) => ({
    name: bus.busName.length > 15 ? bus.busName.substring(0, 15) + '...' : bus.busName,
    fullName: bus.busName,
    revenue: bus.revenue,
    passengers: bus.passengers,
    trips: bus.trips
  })) : [];

  const revenueTrendData = analytics ? analytics.trends.revenueTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    revenue: item.revenue
  })) : [];

  const passengerTrendData = analytics ? analytics.trends.revenueTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    passengers: Math.floor(item.revenue / 50) // Estimate passengers based on average fare
  })) : [];

  const combinedTrendData = analytics ? analytics.trends.revenueTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    revenue: item.revenue,
    passengers: Math.floor(item.revenue / 50),
    bookings: Math.floor(item.revenue / 100)
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No analytics data available</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bus Analytics</h1>
          <p className="text-gray-600">Comprehensive analytics and insights for your bus operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchAnalytics} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.overview.revenueGrowth)}
              <span className={`ml-1 ${getGrowthColor(analytics.overview.revenueGrowth)}`}>
                {formatPercentage(analytics.overview.revenueGrowth)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalPassengers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.overview.passengerGrowth)}
              <span className={`ml-1 ${getGrowthColor(analytics.overview.passengerGrowth)}`}>
                {formatPercentage(analytics.overview.passengerGrowth)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeTrips}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.overview.totalTrips} total trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.routes.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              Active routes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Online Bookings</CardTitle>
            <CardDescription>Revenue from online bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.onlineRevenue)}</div>
            <p className="text-sm text-muted-foreground">
              {analytics.overview.onlinePassengers} passengers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Walk-in Tickets</CardTitle>
            <CardDescription>Revenue from walk-in ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.walkInRevenue)}</div>
            <p className="text-sm text-muted-foreground">
              {analytics.overview.walkInPassengers} passengers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parcel Dispatch</CardTitle>
            <CardDescription>Revenue from parcel dispatch services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.dispatchRevenue)}</div>
            <p className="text-sm text-muted-foreground">
              {analytics.summary.arrivedDispatches} completed dispatches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Routes and Buses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Routes by Revenue</CardTitle>
            <CardDescription>Most profitable routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.routes.topRoutes.map((route, index) => (
                <div key={route.routeName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{route.routeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.passengers} passengers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(route.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {route.bookings} bookings
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Buses by Revenue</CardTitle>
            <CardDescription>Most profitable buses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.buses.topBuses.map((bus, index) => (
                <div key={bus.busName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{bus.busName}</p>
                      <p className="text-sm text-muted-foreground">
                        {bus.passengers} passengers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(bus.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {bus.trips} trips
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Payment Methods Distribution
            </CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Sources
            </CardTitle>
            <CardDescription>Revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={revenueBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>Daily revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `ZMW ${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Route Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Routes Performance
          </CardTitle>
          <CardDescription>Revenue and passenger count by route</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={routePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tickFormatter={(value) => `ZMW ${(value / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value)) : value,
                  name === 'revenue' ? 'Revenue' : 'Passengers'
                ]}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? `Route: ${data.fullName}` : label;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="passengers" stroke="#10b981" strokeWidth={2} name="Passengers" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bus Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Buses Performance
          </CardTitle>
          <CardDescription>Revenue and trip count by bus</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={busPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tickFormatter={(value) => `ZMW ${(value / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value)) : value,
                  name === 'revenue' ? 'Revenue' : 'Trips'
                ]}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? `Bus: ${data.fullName}` : label;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#f59e0b" strokeWidth={2} name="Trips" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Combined Trends Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Combined Performance Trends
          </CardTitle>
          <CardDescription>Revenue, passengers, and bookings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={combinedTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" tickFormatter={(value) => `ZMW ${(value / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value)) : value,
                  name === 'revenue' ? 'Revenue' : name === 'passengers' ? 'Passengers' : 'Bookings'
                ]}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Revenue" />
              <Area yAxisId="right" type="monotone" dataKey="passengers" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Passengers" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Operations Summary</CardTitle>
          <CardDescription>Key operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.totalBookings}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.completedBookings}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.totalTickets}</p>
              <p className="text-sm text-muted-foreground">Walk-in Tickets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.activeTickets}</p>
              <p className="text-sm text-muted-foreground">Active Tickets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.totalDispatches}</p>
              <p className="text-sm text-muted-foreground">Total Dispatches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.summary.arrivedDispatches}</p>
              <p className="text-sm text-muted-foreground">Arrived</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}