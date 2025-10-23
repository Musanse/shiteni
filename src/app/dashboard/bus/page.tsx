'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Bus, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface BusStats {
  totalRoutes: number;
  activeRoutes: number;
  totalSchedules: number;
  scheduledToday: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalPassengers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  fleetSize: number;
  activeBuses: number;
}

export default function BusDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<BusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bus statistics
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API call
        // const response = await fetch('/api/bus/stats');
        // const data = await response.json();
        
        // Mock data for now
        setStats({
          totalRoutes: 25,
          activeRoutes: 22,
          totalSchedules: 180,
          scheduledToday: 45,
          totalBookings: 5420,
          pendingBookings: 85,
          confirmedBookings: 5280,
          totalPassengers: 2150,
          totalRevenue: 3250000,
          monthlyRevenue: 285000,
          averageBookingValue: 600,
          fleetSize: 35,
          activeBuses: 28
        });
      } catch (error) {
        console.error('Error fetching bus stats:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Bus Ticketing</h1>
          <p className="text-muted-foreground">
            Manage your bus operations, routes, and ticket bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <MapPin className="h-4 w-4 mr-2" />
            Add Route
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Trip
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeRoutes} active routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingBookings} pending, {stats?.confirmedBookings} confirmed
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
            <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fleetSize}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeBuses} active buses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedules
            </CardTitle>
            <CardDescription>
              Manage today's bus schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Scheduled Trips</span>
                <span className="text-sm font-medium">{stats?.scheduledToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Departures</span>
                <span className="text-sm font-medium">22</span>
              </div>
              <Button className="w-full" variant="outline">
                View Schedules
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Management
            </CardTitle>
            <CardDescription>
              Monitor routes and stops
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Routes</span>
                <span className="text-sm font-medium text-green-600">{stats?.activeRoutes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintenance</span>
                <span className="text-sm font-medium text-orange-600">3</span>
              </div>
              <Button className="w-full" variant="outline">
                Manage Routes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Passenger Management
            </CardTitle>
            <CardDescription>
              Track passenger bookings and travel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Passengers</span>
                <span className="text-sm font-medium">{stats?.totalPassengers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bookings Today</span>
                <span className="text-sm font-medium">156</span>
              </div>
              <Button className="w-full" variant="outline">
                View Passengers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
          <CardDescription>
            Current status of your bus fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Active Buses</p>
                <p className="text-xs text-muted-foreground">{stats?.activeBuses} buses in service</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Maintenance</p>
                <p className="text-xs text-muted-foreground">3 buses under maintenance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Out of Service</p>
                <p className="text-xs text-muted-foreground">4 buses out of service</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest bus operations and passenger activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Bus #101 departed</p>
                <p className="text-xs text-muted-foreground">Route: City A to City B • 45 passengers • 8:30 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New booking received</p>
                <p className="text-xs text-muted-foreground">Route: City C to City D • 2 passengers • $120</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Bus #205 arrived</p>
                <p className="text-xs text-muted-foreground">Route: City E to City F • 38 passengers • 10:15 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
