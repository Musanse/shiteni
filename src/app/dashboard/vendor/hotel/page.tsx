'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionGate from '@/components/SubscriptionGate';
import { 
  Building2, 
  Bed, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
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

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  checkedOutBookings: number;
  totalGuests: number;
  currentGuests: number;
  totalRevenue: number;
  todayRevenue: number;
  paidRevenue: number;
}

interface RecentActivity {
  type: string;
  message: string;
  details: string;
  status: string;
  createdAt: string;
}

interface ChartData {
  roomStatusPie: Array<{ name: string; value: number; color: string }>;
  bookingStatusPie: Array<{ name: string; value: number; color: string }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  bookingsByDay: Array<{ day: string; bookings: number }>;
  roomTypeDistribution: Array<{ name: string; value: number; color: string }>;
  occupancyRateByMonth: Array<{ month: string; occupancyRate: number }>;
  averageStayDuration: number;
  revenueByPaymentMethod: Array<{ name: string; value: number; color: string }>;
}

export default function HotelVendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    checkedInBookings: 0,
    checkedOutBookings: 0,
    totalGuests: 0,
    currentGuests: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    paidRevenue: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    roomStatusPie: [],
    bookingStatusPie: [],
    revenueByMonth: [],
    bookingsByDay: [],
    roomTypeDistribution: [],
    occupancyRateByMonth: [],
    averageStayDuration: 0,
    revenueByPaymentMethod: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/hotel/dashboard');
        
        // Check if response is ok and content type is JSON
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
          setRecentActivities(data.recentActivities || []);
        } else {
          console.error('API returned error:', data.error);
        }
      } catch (error) {
        console.error('Error fetching hotel dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        // Set default empty data to prevent crashes
        setStats({
          totalRooms: 0,
          availableRooms: 0,
          occupiedRooms: 0,
          maintenanceRooms: 0,
          totalBookings: 0,
          todayBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          checkedInBookings: 0,
          checkedOutBookings: 0,
          totalGuests: 0,
          currentGuests: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          paidRevenue: 0
        });
        setChartData({
          roomStatusPie: [],
          bookingStatusPie: [],
          revenueByMonth: [],
          bookingsByDay: [],
          roomTypeDistribution: [],
          occupancyRateByMonth: [],
          averageStayDuration: 0,
          revenueByPaymentMethod: []
        });
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'destructive';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hotel dashboard...</p>
        </div>
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
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <SubscriptionGate serviceType="hotel">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Management Dashboard</h1>
          <p className="text-muted-foreground">Manage your hotel operations and bookings</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">{stats.availableRooms} available, {stats.occupiedRooms} occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.checkedInBookings} check-ins, {stats.checkedOutBookings} check-outs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentGuests}</div>
            <p className="text-xs text-muted-foreground">Across {stats.occupiedRooms} rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {stats.todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Total: ZMW {stats.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Room Status Distribution
            </CardTitle>
            <CardDescription>Current room availability status</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.roomStatusPie.length > 0 ? (
              <div className="h-64">
                <Pie
                  data={{
                    labels: chartData.roomStatusPie.map(item => item.name),
                    datasets: [{
                      data: chartData.roomStatusPie.map(item => item.value),
                      backgroundColor: chartData.roomStatusPie.map(item => item.color),
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
                No room data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
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

        {/* Revenue by Month Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend (Last 6 Months)
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
                      borderWidth: 1,
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
                        display: false,
                      },
                    },
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

        {/* Bookings by Day Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bookings Trend (Last 7 Days)
            </CardTitle>
            <CardDescription>Daily booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.bookingsByDay.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={{
                    labels: chartData.bookingsByDay.map(item => item.day),
                    datasets: [{
                      label: 'Bookings',
                      data: chartData.bookingsByDay.map(item => item.bookings),
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      borderColor: 'rgba(16, 185, 129, 1)',
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false,
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

        {/* Occupancy Rate Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Occupancy Rate Trend
            </CardTitle>
            <CardDescription>Monthly occupancy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.occupancyRateByMonth.length > 0 ? (
              <div className="h-64">
                <Line
                  data={{
                    labels: chartData.occupancyRateByMonth.map(item => item.month),
                    datasets: [{
                      label: 'Occupancy Rate (%)',
                      data: chartData.occupancyRateByMonth.map(item => item.occupancyRate),
                      borderColor: 'rgba(245, 158, 11, 1)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No occupancy data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Payment Method Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Payment Method
            </CardTitle>
            <CardDescription>Payment method distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.revenueByPaymentMethod.length > 0 ? (
              <div className="h-64">
                <Pie
                  data={{
                    labels: chartData.revenueByPaymentMethod.map(item => item.name),
                    datasets: [{
                      data: chartData.revenueByPaymentMethod.map(item => item.value),
                      backgroundColor: chartData.revenueByPaymentMethod.map(item => item.color),
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
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.label + ': ZMW ' + context.parsed.toLocaleString();
                          }
                        }
                      }
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

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Stay Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.averageStayDuration}</div>
            <p className="text-xs text-muted-foreground">days per booking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Types</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.roomTypeDistribution.length}</div>
            <p className="text-xs text-muted-foreground">different room types</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">all-time revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>Manage your hotel rooms and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <Bed className="h-4 w-4 mr-2" />
              View All Rooms
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Add New Room
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Room Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>Handle reservations and guest services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Guest Check-in
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest hotel operations and bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${getActivityColor(activity.status)} rounded-full`}></div>
                    <div>
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                  </div>
                  <Badge variant={getActivityBadgeVariant(activity.status)}>
                    {activity.type === 'check-in' ? 'Check-in' : 
                     activity.type === 'check-out' ? 'Check-out' : 'Booking'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </SubscriptionGate>
  );
}