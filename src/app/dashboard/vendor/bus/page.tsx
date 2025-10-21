'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionGate from '@/components/SubscriptionGate';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Truck,
  Ticket,
  AlertCircle,
  CheckCircle,
  XCircle,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface BusStats {
  totalRoutes: number;
  activeRoutes: number;
  totalTrips: number;
  todayTrips: number;
  totalPassengers: number;
  todayPassengers: number;
  totalRevenue: number;
  todayRevenue: number;
  fleetSize: number;
  activeBuses: number;
  pendingBookings: number;
  confirmedBookings: number;
}

interface ChartData {
  routeStatusPie: Array<{ name: string; value: number; color: string }>;
  fleetStatusPie: Array<{ name: string; value: number; color: string }>;
  bookingStatusPie: Array<{ name: string; value: number; color: string }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  passengersByDay: Array<{ day: string; passengers: number }>;
  tripStatusDistribution: Array<{ name: string; value: number; color: string }>;
  topRoutesByRevenue: Array<{ name: string; revenue: number }>;
  averageOccupancyRate: number;
  paymentMethodsDistribution: Array<{ name: string; value: number; color: string }>;
}

interface RecentTrip {
  _id: string;
  routeName: string;
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  status: string;
  createdAt: string;
}

interface RecentBooking {
  _id: string;
  passengerName: string;
  routeName: string;
  departureTime: string;
  seatNumber: string;
  status: string;
  amount: number;
  createdAt: string;
}

export default function BusDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<BusStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bus/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setChartData(data.chartData || {});
        setRecentTrips(data.recentTrips || []);
        setRecentBookings(data.recentBookings || []);
      } else {
        console.error('API returned error:', data.error);
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching bus dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      // Set default empty data to prevent crashes
      setStats({
        totalRoutes: 0,
        activeRoutes: 0,
        totalTrips: 0,
        todayTrips: 0,
        totalPassengers: 0,
        todayPassengers: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        fleetSize: 0,
        activeBuses: 0,
        pendingBookings: 0,
        confirmedBookings: 0
      });
      setChartData({
        routeStatusPie: [],
        fleetStatusPie: [],
        bookingStatusPie: [],
        revenueByMonth: [],
        passengersByDay: [],
        tripStatusDistribution: [],
        topRoutesByRevenue: [],
        averageOccupancyRate: 0,
        paymentMethodsDistribution: []
      });
      setRecentTrips([]);
      setRecentBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      pending: 'outline',
      confirmed: 'default'
    } as const;

    const colors = {
      active: 'text-green-600',
      completed: 'text-blue-600',
      cancelled: 'text-red-600',
      pending: 'text-yellow-600',
      confirmed: 'text-green-600'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <span className={colors[status as keyof typeof colors] || 'text-gray-600'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-ZM', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGate serviceType="bus">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Management Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {(session?.user as any)?.firstName || 'User'}! Here's your bus operation overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bus className="h-8 w-8 text-primary" />
          <span className="text-sm text-gray-500">Bus Management</span>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Routes Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRoutes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeRoutes} active routes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTrips}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTrips} total trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Passengers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayPassengers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPassengers} total passengers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalRevenue)} total revenue
              </p>
            </CardContent>
          </Card>

          {/* Fleet Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fleetSize}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeBuses} active buses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.confirmedBookings} confirmed bookings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Route Status Distribution
              </CardTitle>
              <CardDescription>Current route availability status</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.routeStatusPie.length > 0 ? (
                <div className="h-64">
                  <Pie
                    data={{
                      labels: chartData.routeStatusPie.map(item => item.name),
                      datasets: [{
                        data: chartData.routeStatusPie.map(item => item.value),
                        backgroundColor: chartData.routeStatusPie.map(item => item.color),
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No route data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fleet Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fleet Status Distribution
              </CardTitle>
              <CardDescription>Current fleet availability status</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.fleetStatusPie.length > 0 ? (
                <div className="h-64">
                  <Pie
                    data={{
                      labels: chartData.fleetStatusPie.map(item => item.name),
                      datasets: [{
                        data: chartData.fleetStatusPie.map(item => item.value),
                        backgroundColor: chartData.fleetStatusPie.map(item => item.color),
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No fleet data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Month Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trends (Last 6 Months)
              </CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.revenueByMonth.length > 0 ? (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: chartData.revenueByMonth.map(item => item.month),
                      datasets: [{
                        label: 'Revenue (ZMW)',
                        data: chartData.revenueByMonth.map(item => item.revenue),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return 'ZMW ' + value.toLocaleString();
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passengers by Day Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daily Passengers (Last 7 Days)
              </CardTitle>
              <CardDescription>Passenger count trends</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.passengersByDay.length > 0 ? (
                <div className="h-64">
                  <Line
                    data={{
                      labels: chartData.passengersByDay.map(item => item.day),
                      datasets: [{
                        label: 'Passengers',
                        data: chartData.passengersByDay.map(item => item.passengers),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No passenger data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Booking Status Distribution
              </CardTitle>
              <CardDescription>Current booking status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.bookingStatusPie.length > 0 ? (
                <div className="h-64">
                  <Pie
                    data={{
                      labels: chartData.bookingStatusPie.map(item => item.name),
                      datasets: [{
                        data: chartData.bookingStatusPie.map(item => item.value),
                        backgroundColor: chartData.bookingStatusPie.map(item => item.color),
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No booking data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Methods Distribution
              </CardTitle>
              <CardDescription>Payment method preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.paymentMethodsDistribution.length > 0 ? (
                <div className="h-64">
                  <Pie
                    data={{
                      labels: chartData.paymentMethodsDistribution.map(item => item.name),
                      datasets: [{
                        data: chartData.paymentMethodsDistribution.map(item => item.value),
                        backgroundColor: chartData.paymentMethodsDistribution.map(item => item.color),
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats Cards */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chartData.averageOccupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                Across all trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performing Route</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chartData.topRoutesByRevenue.length > 0 ? chartData.topRoutesByRevenue[0].name : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {chartData.topRoutesByRevenue.length > 0 ? formatCurrency(chartData.topRoutesByRevenue[0].revenue) : 'No data'} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trip Status Overview</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chartData.tripStatusDistribution.slice(0, 3).map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{status.name}</span>
                    <Badge variant="outline">{status.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Trips
            </CardTitle>
            <CardDescription>
              Latest scheduled trips and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrips.length > 0 ? (
                recentTrips.map((trip) => (
                  <div key={trip._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{trip.routeName}</h4>
                        {getStatusBadge(trip.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trip.passengers} passengers
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent trips found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>
              Latest passenger bookings and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{booking.passengerName}</h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.routeName} - Seat {booking.seatNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(booking.departureTime)} - {formatCurrency(booking.amount)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent bookings found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Bus className="h-6 w-6 mb-2" />
              <span className="text-sm">Add Route</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-sm">Schedule Trip</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Manage Staff</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Truck className="h-6 w-6 mb-2" />
              <span className="text-sm">Fleet Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </SubscriptionGate>
  );
}