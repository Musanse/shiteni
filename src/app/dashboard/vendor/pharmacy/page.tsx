'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionGate from '@/components/SubscriptionGate';
import { 
  Pill, 
  Package, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  BarChart3,
  Shield,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
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
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface DashboardStats {
  totalMedicines: number;
  activeMedicines: number;
  lowStockMedicines: number;
  expiredMedicines: number;
  todayPrescriptions: number;
  pendingPrescriptions: number;
  dispensedPrescriptions: number;
  totalPatients: number;
  weekPatients: number;
  todayRevenue: number;
  revenueGrowth: number;
}

interface RecentPrescription {
  _id: string;
  prescriptionNumber: string;
  patientName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface RecentMedicine {
  _id: string;
  name: string;
  stock: number;
  status: string;
  createdAt: string;
}

interface ChartData {
  labels: string[];
  data: number[];
  colors: string[];
}

interface ChartsData {
  medicineStatus: ChartData;
  prescriptionStatus: ChartData;
  revenueTrend: ChartData;
  medicineCategories: ChartData;
  monthlyPrescriptions: ChartData;
  topSellingMedicines: ChartData;
}

interface DashboardData {
  stats: DashboardStats;
  charts: ChartsData;
  recentPrescriptions: RecentPrescription[];
  recentMedicines: RecentMedicine[];
}

export default function PharmacyVendorDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'dispensed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      dispensed: 'default',
      cancelled: 'destructive',
      expired: 'outline',
      active: 'default',
      low_stock: 'outline',
      expired_medicine: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  const { stats, charts, recentPrescriptions, recentMedicines } = dashboardData;

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <SubscriptionGate serviceType="pharmacy">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Management Dashboard</h1>
          <p className="text-muted-foreground">Manage your pharmacy and medicine inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/vendor/pharmacy/medicines">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </Link>
          <Link href="/dashboard/vendor/pharmacy/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedicines}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMedicines} active, {stats.lowStockMedicines} low stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.dispensedPrescriptions} dispensed, {stats.pendingPrescriptions} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.weekPatients} this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1" />
              )}
              {Math.abs(stats.revenueGrowth)}% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medicine Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="h-5 w-5 mr-2" />
              Medicine Status Distribution
            </CardTitle>
            <CardDescription>Overview of medicine inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie
                data={{
                  labels: charts.medicineStatus.labels,
                  datasets: [
                    {
                      data: charts.medicineStatus.data,
                      backgroundColor: charts.medicineStatus.colors,
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={pieChartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescription Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Prescription Status Distribution
            </CardTitle>
            <CardDescription>Current prescription order status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie
                data={{
                  labels: charts.prescriptionStatus.labels,
                  datasets: [
                    {
                      data: charts.prescriptionStatus.data,
                      backgroundColor: charts.prescriptionStatus.colors,
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={pieChartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
            <CardDescription>Daily revenue from confirmed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={{
                  labels: charts.revenueTrend.labels,
                  datasets: [
                    {
                      label: 'Revenue (ZMW)',
                      data: charts.revenueTrend.data,
                      backgroundColor: charts.revenueTrend.colors[0],
                      borderColor: charts.revenueTrend.colors[0],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medicine Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Medicine Categories
            </CardTitle>
            <CardDescription>Distribution of medicines by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie
                data={{
                  labels: charts.medicineCategories.labels,
                  datasets: [
                    {
                      data: charts.medicineCategories.data,
                      backgroundColor: charts.medicineCategories.colors,
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={pieChartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Prescription Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Prescription Trends
            </CardTitle>
            <CardDescription>Prescription orders over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line
                data={{
                  labels: charts.monthlyPrescriptions.labels,
                  datasets: [
                    {
                      label: 'Prescriptions',
                      data: charts.monthlyPrescriptions.data,
                      borderColor: charts.monthlyPrescriptions.colors[0],
                      backgroundColor: charts.monthlyPrescriptions.colors[0] + '20',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Medicines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Selling Medicines
            </CardTitle>
            <CardDescription>Most popular medicines by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={{
                  labels: charts.topSellingMedicines.labels,
                  datasets: [
                    {
                      label: 'Units Sold',
                      data: charts.topSellingMedicines.data,
                      backgroundColor: charts.topSellingMedicines.colors[0],
                      borderColor: charts.topSellingMedicines.colors[0],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Medicine Management</CardTitle>
            <CardDescription>Manage your pharmacy inventory and medicines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/vendor/pharmacy/medicines">
              <Button className="w-full justify-start">
                <Pill className="h-4 w-4 mr-2" />
                View All Medicines
              </Button>
            </Link>
            <Link href="/dashboard/vendor/pharmacy/medicines">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add New Medicine
              </Button>
            </Link>
            <Link href="/dashboard/vendor/pharmacy/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Pharmacy Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescription Management</CardTitle>
            <CardDescription>Handle prescriptions and patient care</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/vendor/pharmacy/prescriptions">
              <Button className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Prescriptions
              </Button>
            </Link>
            <Link href="/dashboard/vendor/pharmacy/patients">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Patient Records
              </Button>
            </Link>
            <Link href="/dashboard/vendor/pharmacy/inbox">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>Latest prescription orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrescriptions.length > 0 ? (
                recentPrescriptions.map((prescription) => (
                  <div key={prescription._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(prescription.status)}
                      <div>
                        <p className="font-medium">Prescription #{prescription.prescriptionNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {prescription.patientName} • K {prescription.totalAmount.toFixed(2)} • {format(new Date(prescription.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent prescriptions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Medicines */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Medicines</CardTitle>
            <CardDescription>Latest medicines added to inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMedicines.length > 0 ? (
                recentMedicines.map((medicine) => (
                  <div key={medicine._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Pill className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{medicine.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {medicine.stock} • {format(new Date(medicine.createdAt), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(medicine.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent medicines</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </SubscriptionGate>
  );
}