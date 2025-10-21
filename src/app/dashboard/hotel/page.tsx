'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  Bed, 
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface HotelStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export default function HotelDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<HotelStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hotel statistics
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API call
        // const response = await fetch('/api/hotel/stats');
        // const data = await response.json();
        
        // Mock data for now
        setStats({
          totalRooms: 150,
          availableRooms: 45,
          occupiedRooms: 105,
          totalBookings: 1247,
          pendingBookings: 23,
          confirmedBookings: 1180,
          totalRevenue: 1250000,
          monthlyRevenue: 85000,
          occupancyRate: 70
        });
      } catch (error) {
        console.error('Error fetching hotel stats:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Hotel Management</h1>
          <p className="text-muted-foreground">
            Manage your hotel operations, bookings, and guest services
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Rooms
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.availableRooms} available, {stats?.occupiedRooms} occupied
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
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              Current occupancy
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
              Recent Bookings
            </CardTitle>
            <CardDescription>
              Manage incoming booking requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Bookings</span>
                <span className="text-sm font-medium">{stats?.pendingBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Confirmed Today</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <Button className="w-full" variant="outline">
                View All Bookings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Room Management
            </CardTitle>
            <CardDescription>
              Monitor room status and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Available Rooms</span>
                <span className="text-sm font-medium text-green-600">{stats?.availableRooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintenance</span>
                <span className="text-sm font-medium text-orange-600">5</span>
              </div>
              <Button className="w-full" variant="outline">
                Manage Rooms
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guest Services
            </CardTitle>
            <CardDescription>
              Handle guest requests and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Check-ins Today</span>
                <span className="text-sm font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Check-outs Today</span>
                <span className="text-sm font-medium">6</span>
              </div>
              <Button className="w-full" variant="outline">
                Guest Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest hotel operations and guest activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Room 205 checked in</p>
                <p className="text-xs text-muted-foreground">Guest: John Smith • 2:30 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New booking request</p>
                <p className="text-xs text-muted-foreground">Room 301 • 3 nights • $450</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Room 102 checked out</p>
                <p className="text-xs text-muted-foreground">Guest: Sarah Johnson • 11:15 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
