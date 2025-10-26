'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Bed, 
  DollarSign, 
  Calendar,
  Star,
  Clock,
  Target,
  PieChart,
  Activity
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface AnalyticsData {
  occupancyRate: number;
  revenue: number;
  averageRoomRate: number;
  totalBookings: number;
  cancellationRate: number;
  guestSatisfaction: number;
  revenueGrowth: number;
  occupancyGrowth: number;
  revenueChartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
  occupancyChartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

export default function HotelAnalyticsPage() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  // Fetch analytics data from database
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const days = parseInt(timeRange);
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      // Fetch data from multiple sources
      const [bookingsResponse, roomsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/hotel/bookings'),
        fetch('/api/hotel/rooms'),
        fetch('/api/hotel/payments')
      ]);
      
      // Handle API errors gracefully
      let bookings = [];
      let rooms = [];
      let payments = [];
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        bookings = bookingsData.bookings || [];
      } else {
        console.warn('Failed to fetch bookings:', bookingsResponse.status, bookingsResponse.statusText);
      }
      
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        rooms = roomsData.rooms || [];
      } else {
        console.warn('Failed to fetch rooms:', roomsResponse.status, roomsResponse.statusText);
      }
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        payments = paymentsData.payments || [];
      } else {
        console.warn('Failed to fetch payments:', paymentsResponse.status, paymentsResponse.statusText);
      }
      
      // Filter bookings by date range
      const filteredBookings = bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
      
      // Calculate analytics
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((room: any) => room.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      
      // Calculate revenue from payments or bookings
      let totalRevenue = 0;
      if (payments.length > 0) {
        totalRevenue = payments.reduce((sum: number, payment: any) => sum + (payment.netAmount || payment.amount || 0), 0);
      } else {
        totalRevenue = filteredBookings.reduce((sum: number, booking: any) => sum + (booking.totalAmount || 0), 0);
      }
      
      // Calculate average room rate
      const completedBookings = filteredBookings.filter((booking: any) => 
        booking.status === 'confirmed' || booking.status === 'checked-in' || booking.status === 'checked-out'
      );
      const averageRoomRate = completedBookings.length > 0 
        ? totalRevenue / completedBookings.length 
        : 0;
      
      // Calculate cancellation rate
      const cancelledBookings = filteredBookings.filter((booking: any) => booking.status === 'cancelled').length;
      const cancellationRate = filteredBookings.length > 0 
        ? (cancelledBookings / filteredBookings.length) * 100 
        : 0;
      
      // Mock guest satisfaction (would come from reviews in real system)
      const guestSatisfaction = 4.6;
      
      // Calculate growth (mock for now - would compare with previous period)
      const revenueGrowth = 12.5;
      const occupancyGrowth = 5.8;
      
      // Generate chart data
      const revenueChartData = generateRevenueChartData(filteredBookings, payments, days);
      const occupancyChartData = generateOccupancyChartData(bookings, rooms, days);
      
      const analytics: AnalyticsData = {
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        revenue: Math.round(totalRevenue),
        averageRoomRate: Math.round(averageRoomRate),
        totalBookings: filteredBookings.length,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        guestSatisfaction,
        revenueGrowth,
        occupancyGrowth,
        revenueChartData,
        occupancyChartData
      };
      
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to mock data on error
      const mockChartData = {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
      
      setAnalyticsData({
        occupancyRate: 0,
        revenue: 0,
        averageRoomRate: 0,
        totalBookings: 0,
        cancellationRate: 0,
        guestSatisfaction: 0,
        revenueGrowth: 0,
        occupancyGrowth: 0,
        revenueChartData: mockChartData,
        occupancyChartData: mockChartData
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate revenue chart data
  const generateRevenueChartData = (bookings: any[], payments: any[], days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const labels = dateRange.map(date => format(date, 'MMM dd'));
    const revenueData = new Array(dateRange.length).fill(0);
    
    // Process payments first (more accurate)
    if (payments.length > 0) {
      payments.forEach(payment => {
        const paymentDate = new Date(payment.processedAt);
        const dayIndex = dateRange.findIndex(date => 
          format(date, 'yyyy-MM-dd') === format(paymentDate, 'yyyy-MM-dd')
        );
        if (dayIndex >= 0) {
          revenueData[dayIndex] += payment.netAmount || payment.amount || 0;
        }
      });
    } else {
      // Fallback to booking data
      bookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        const dayIndex = dateRange.findIndex(date => 
          format(date, 'yyyy-MM-dd') === format(bookingDate, 'yyyy-MM-dd')
        );
        if (dayIndex >= 0) {
          revenueData[dayIndex] += booking.totalAmount || 0;
        }
      });
    }
    
    return {
      labels,
      datasets: [{
        label: 'Daily Revenue',
        data: revenueData,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  // Generate occupancy chart data
  const generateOccupancyChartData = (bookings: any[], rooms: any[], days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const labels = dateRange.map(date => format(date, 'MMM dd'));
    const occupancyData = new Array(dateRange.length).fill(0);
    
    // Calculate daily occupancy rates
    dateRange.forEach((date, index) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count occupied rooms for this date
      const occupiedRooms = bookings.filter(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const checkInStr = format(checkIn, 'yyyy-MM-dd');
        const checkOutStr = format(checkOut, 'yyyy-MM-dd');
        
        return dateStr >= checkInStr && dateStr < checkOutStr && 
               (booking.status === 'confirmed' || booking.status === 'checked-in');
      }).length;
      
      const totalRooms = rooms.length;
      occupancyData[index] = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    });
    
    return {
      labels,
      datasets: [{
        label: 'Occupancy Rate (%)',
        data: occupancyData,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const handleExportReport = () => {
    if (!analyticsData) {
      console.error('No analytics data available for export');
      return;
    }

    // Create comprehensive CSV content for Excel compatibility
    const csvContent = [
      // Header section
      ['HOTEL ANALYTICS REPORT'],
      ['Generated on:', format(new Date(), 'MMMM dd, yyyy HH:mm:ss')],
      ['Time Period:', `${timeRange} days`],
      [''],
      
      // Key Metrics section
      ['KEY METRICS'],
      ['Metric', 'Value', 'Description'],
      ['Occupancy Rate', `${analyticsData.occupancyRate}%`, 'Percentage of rooms occupied'],
      ['Total Revenue', `ZMW ${analyticsData.revenue.toLocaleString()}`, 'Total revenue generated'],
      ['Average Room Rate', `ZMW ${analyticsData.averageRoomRate.toFixed(2)}`, 'Average price per room'],
      ['Total Bookings', analyticsData.totalBookings.toString(), 'Total number of bookings'],
      ['Cancellation Rate', `${analyticsData.cancellationRate}%`, 'Percentage of cancelled bookings'],
      ['Guest Satisfaction', `${analyticsData.guestSatisfaction}%`, 'Guest satisfaction score'],
      ['Revenue Growth', `${analyticsData.revenueGrowth}%`, 'Revenue growth from previous period'],
      ['Occupancy Growth', `${analyticsData.occupancyGrowth}%`, 'Occupancy growth from previous period'],
      [''],
      
      // Chart Data section (if available)
      ['CHART DATA'],
      ['Chart Type', 'Date', 'Value', 'Description']
    ];

    // Add revenue chart data if available
    if (analyticsData.revenueChartData && analyticsData.revenueChartData.labels.length > 0) {
      analyticsData.revenueChartData.labels.forEach((label, index) => {
        const value = analyticsData.revenueChartData.datasets[0].data[index] || 0;
        csvContent.push(['Revenue Trend', label, `ZMW ${value.toLocaleString()}`, 'Daily revenue']);
      });
    }

    csvContent.push(['']);

    // Add occupancy chart data if available
    if (analyticsData.occupancyChartData && analyticsData.occupancyChartData.labels.length > 0) {
      analyticsData.occupancyChartData.labels.forEach((label, index) => {
        const value = analyticsData.occupancyChartData.datasets[0].data[index] || 0;
        csvContent.push(['Occupancy Rate', label, `${value.toFixed(1)}%`, 'Daily occupancy percentage']);
      });
    }

    csvContent.push(['']);
    csvContent.push(['Report generated by Shiteni Hotel Management System']);

    // Convert to CSV string
    const csvString = csvContent.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvString;

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (session?.user) {
      fetchAnalyticsData();
    } else {
      // Show loading state when not authenticated
      setLoading(false);
      setAnalyticsData({
        occupancyRate: 0,
        revenue: 0,
        averageRoomRate: 0,
        totalBookings: 0,
        cancellationRate: 0,
        guestSatisfaction: 0,
        revenueGrowth: 0,
        occupancyGrowth: 0,
        revenueChartData: {
          labels: ['No Data'],
          datasets: [{
            label: 'Authentication Required',
            data: [0],
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderColor: 'rgba(156, 163, 175, 1)',
          }]
        },
        occupancyChartData: {
          labels: ['No Data'],
          datasets: [{
            label: 'Authentication Required',
            data: [0],
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderColor: 'rgba(156, 163, 175, 1)',
          }]
        }
      });
    }
  }, [session, timeRange]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold mb-4">Hotel Analytics</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your hotel analytics</p>
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-sm text-muted-foreground">
              To access hotel analytics, you need to be signed in as a hotel vendor.
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
          <h1 className="text-3xl font-bold">Hotel Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your hotel performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} disabled={!analyticsData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.occupancyRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData?.occupancyGrowth && analyticsData.occupancyGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analyticsData?.occupancyGrowth && analyticsData.occupancyGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {analyticsData?.occupancyGrowth}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {analyticsData?.revenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData?.revenueGrowth && analyticsData.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analyticsData?.revenueGrowth && analyticsData.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {analyticsData?.revenueGrowth}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Room Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {analyticsData?.averageRoomRate}</div>
            <p className="text-xs text-muted-foreground">Per night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.guestSatisfaction}/5.0</div>
            <p className="text-xs text-muted-foreground">Based on reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line 
                data={analyticsData?.revenueChartData || { labels: [], datasets: [] }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      callbacks: {
                        label: function(context) {
                          return `ZMW ${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Revenue (ZMW)'
                      },
                      ticks: {
                        callback: function(value) {
                          return 'ZMW ' + value.toLocaleString();
                        }
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Daily occupancy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line 
                data={analyticsData?.occupancyChartData || { labels: [], datasets: [] }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      callbacks: {
                        label: function(context) {
                          return `${context.parsed.y.toFixed(1)}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Occupancy Rate (%)'
                      },
                      min: 0,
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Performance</CardTitle>
            <CardDescription>Key booking metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="font-semibold">{analyticsData?.totalBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cancellation Rate</span>
              <span className="font-semibold text-red-600">{analyticsData?.cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Stay Duration</span>
              <span className="font-semibold">2.3 nights</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Repeat Guest Rate</span>
              <span className="font-semibold text-green-600">35%</span>
            </div>
          </CardContent>
        </Card>

        {/* Guest Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Demographics</CardTitle>
            <CardDescription>Guest composition analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Business Travelers</span>
              <span className="font-semibold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Leisure Travelers</span>
              <span className="font-semibold">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Group Bookings</span>
              <span className="font-semibold">20%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">International Guests</span>
              <span className="font-semibold">60%</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Breakdown of revenue streams</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Room Revenue</span>
              <span className="font-semibold">75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Food & Beverage</span>
              <span className="font-semibold">15%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spa & Wellness</span>
              <span className="font-semibold">5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Other Services</span>
              <span className="font-semibold">5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Targets */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
          <CardDescription>Track progress towards your hotel goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Occupancy Target</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analyticsData?.occupancyRate || 0) / 85 * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.occupancyRate}% achieved
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Revenue Target</span>
                <span className="text-sm text-muted-foreground">ZMW 150,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(analyticsData?.revenue || 0) / 150000 * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                ZMW {analyticsData?.revenue.toLocaleString()} achieved
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Satisfaction Target</span>
                <span className="text-sm text-muted-foreground">4.8/5.0</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(analyticsData?.guestSatisfaction || 0) / 4.8 * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.guestSatisfaction}/5.0 achieved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
