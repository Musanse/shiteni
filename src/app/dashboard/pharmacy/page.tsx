'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Pill, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PharmacyStats {
  totalMedicines: number;
  activeMedicines: number;
  expiredMedicines: number;
  lowStockMedicines: number;
  totalPrescriptions: number;
  pendingPrescriptions: number;
  dispensedPrescriptions: number;
  totalPatients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averagePrescriptionValue: number;
}

export default function PharmacyDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pharmacy statistics
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API call
        // const response = await fetch('/api/pharmacy/stats');
        // const data = await response.json();
        
        // Mock data for now
        setStats({
          totalMedicines: 850,
          activeMedicines: 780,
          expiredMedicines: 15,
          lowStockMedicines: 25,
          totalPrescriptions: 2150,
          pendingPrescriptions: 35,
          dispensedPrescriptions: 2080,
          totalPatients: 450,
          totalRevenue: 1850000,
          monthlyRevenue: 125000,
          averagePrescriptionValue: 580
        });
      } catch (error) {
        console.error('Error fetching pharmacy stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Store</h1>
          <p className="text-muted-foreground">
            Manage your pharmacy operations, medicines, and prescriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Pill className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMedicines}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeMedicines} active, {stats?.expiredMedicines} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingPrescriptions} pending, {stats?.dispensedPrescriptions} dispensed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total: ${stats?.totalRevenue?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Prescription</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.averagePrescriptionValue}</div>
            <p className="text-xs text-muted-foreground">
              Per prescription
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Prescriptions
            </CardTitle>
            <CardDescription>
              Manage incoming prescription requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Prescriptions</span>
                <span className="text-sm font-medium">{stats?.pendingPrescriptions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prescriptions Today</span>
                <span className="text-sm font-medium">18</span>
              </div>
              <Button className="w-full" variant="outline">
                View All Prescriptions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medicine Inventory
            </CardTitle>
            <CardDescription>
              Monitor medicine stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Stock Items</span>
                <span className="text-sm font-medium text-orange-600">{stats?.lowStockMedicines}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Expired Medicines</span>
                <span className="text-sm font-medium text-red-600">{stats?.expiredMedicines}</span>
              </div>
              <Button className="w-full" variant="outline">
                Manage Inventory
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Management
            </CardTitle>
            <CardDescription>
              Track patient records and history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Patients</span>
                <span className="text-sm font-medium">{stats?.totalPatients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Patients Today</span>
                <span className="text-sm font-medium">5</span>
              </div>
              <Button className="w-full" variant="outline">
                View Patients
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Important Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{stats?.expiredMedicines} medicines have expired and need disposal</span>
            </div>
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{stats?.lowStockMedicines} medicines are running low on stock</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest pharmacy operations and patient activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Prescription #2151 dispensed</p>
                <p className="text-xs text-muted-foreground">Patient: John Smith • 3 medicines • $125.50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New prescription received</p>
                <p className="text-xs text-muted-foreground">Dr. Johnson • Patient: Sarah Wilson • 2 medicines</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Medicine restocked</p>
                <p className="text-xs text-muted-foreground">Paracetamol 500mg • 100 tablets added</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
