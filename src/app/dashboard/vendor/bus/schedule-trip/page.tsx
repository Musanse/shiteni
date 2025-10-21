'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Bus,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface BusTrip {
  _id: string;
  tripName: string;
  busId: string;
  busName: string;
  routeId: string;
  routeName: string;
  departureTimes: {
    to: string;
    from: string;
  };
  daysOfWeek: string[];
  status: string;
  createdAt: string;
}

interface BusRoute {
  _id: string;
  routeName: string;
  stops: Array<{
    stopId: string;
    stopName: string;
    order: number;
  }>;
  fareSegments: Array<{
    from: string;
    to: string;
    fareId: string;
    amount: number;
  }>;
  totalDistance?: number;
  isBidirectional: boolean;
  status: string;
}

interface Bus {
  _id: string;
  busName: string;
  busNumberPlate: string;
  numberOfSeats: number;
  busType: string;
  hasAC: boolean;
  status: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleTripPage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<BusTrip[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<BusTrip | null>(null);
  const [formData, setFormData] = useState({
    tripName: '',
    busId: '',
    busName: '',
    routeId: '',
    routeName: '',
    departureTimes: {
      to: '',
      from: ''
    },
    daysOfWeek: [] as string[],
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tripsResponse, routesResponse, busesResponse] = await Promise.all([
        fetch('/api/bus/trips'),
        fetch('/api/bus/routes'),
        fetch('/api/bus/fleet')
      ]);

      const tripsData = await tripsResponse.json();
      const routesData = await routesResponse.json();
      const busesData = await busesResponse.json();

      if (tripsData.success) {
        setTrips(tripsData.trips || []);
      }
      if (routesData.success) {
        setRoutes(routesData.routes || []);
      }
      if (busesData.success) {
        setBuses(busesData.buses || []);
      }

      if (!tripsData.success) {
        setError(tripsData.error || 'Failed to load trips');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateTripName = (busName: string, routeName: string) => {
    return `${busName} - ${routeName}`;
  };

  const handleBusChange = (busId: string) => {
    const selectedBus = buses.find(bus => bus._id === busId);
    if (selectedBus) {
      setFormData(prev => ({
        ...prev,
        busId,
        busName: selectedBus.busName,
        tripName: prev.routeName ? generateTripName(selectedBus.busName, prev.routeName) : ''
      }));
    }
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = routes.find(route => route._id === routeId);
    if (selectedRoute) {
      setFormData(prev => ({
        ...prev,
        routeId,
        routeName: selectedRoute.routeName,
        tripName: prev.busName ? generateTripName(prev.busName, selectedRoute.routeName) : ''
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleAddTrip = async () => {
    if (!formData.busId || !formData.routeId || formData.daysOfWeek.length === 0) {
      setError('Please select bus, route, and at least one day');
      return;
    }

    try {
      const response = await fetch('/api/bus/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setTrips([...trips, data.trip]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to add trip');
      }
    } catch (error) {
      console.error('Error adding trip:', error);
      setError('Failed to add trip');
    }
  };

  const handleEditTrip = async () => {
    if (!editingTrip) return;

    try {
      const response = await fetch(`/api/bus/trips/${editingTrip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setTrips(trips.map(trip => 
          trip._id === editingTrip._id ? data.trip : trip
        ));
        setIsEditDialogOpen(false);
        setEditingTrip(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      setError('Failed to update trip');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await fetch(`/api/bus/trips/${tripId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setTrips(trips.filter(trip => trip._id !== tripId));
      } else {
        setError(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete trip');
    }
  };

  const resetForm = () => {
    setFormData({
      tripName: '',
      busId: '',
      busName: '',
      routeId: '',
      routeName: '',
      departureTimes: {
        to: '',
        from: ''
      },
      daysOfWeek: [],
      status: 'active'
    });
  };

  const openEditDialog = (trip: BusTrip) => {
    setEditingTrip(trip);
    setFormData({
      tripName: trip.tripName,
      busId: trip.busId,
      busName: trip.busName,
      routeId: trip.routeId,
      routeName: trip.routeName,
      departureTimes: trip.departureTimes,
      daysOfWeek: trip.daysOfWeek,
      status: trip.status
    });
    setIsEditDialogOpen(true);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.routeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      cancelled: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Schedule Trip</h1>
          <p className="text-gray-600 mt-1">Schedule bus trips with routes and timing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Trip</DialogTitle>
              <DialogDescription>
                Create a new bus trip schedule with route, bus, and daily timing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  value={formData.tripName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
                  placeholder="Auto-generated from bus and route"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="busId">Select Bus</Label>
                  <Select value={formData.busId} onValueChange={handleBusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus._id} value={bus._id}>
                          {bus.busName} ({bus.busNumberPlate}) - {bus.numberOfSeats} seats
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="routeId">Select Route</Label>
                  <Select value={formData.routeId} onValueChange={handleRouteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route._id} value={route._id}>
                          {route.routeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureTimeTo">Departure Time (To)</Label>
                  <Input
                    id="departureTimeTo"
                    type="time"
                    value={formData.departureTimes.to}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      departureTimes: { ...prev.departureTimes, to: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="departureTimeFrom">Departure Time (From)</Label>
                  <Input
                    id="departureTimeFrom"
                    type="time"
                    value={formData.departureTimes.from}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      departureTimes: { ...prev.departureTimes, from: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.daysOfWeek.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={day} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTrip} disabled={!formData.busId || !formData.routeId || formData.daysOfWeek.length === 0}>
                  Schedule Trip
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map((trip) => (
          <Card key={trip._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{trip.tripName}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(trip.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(trip)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrip(trip._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {trip.routeName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-gray-400" />
                    <span>{trip.busName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(trip.status)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">To:</span>
                    <span className="font-medium">{trip.departureTimes.to}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">From:</span>
                    <span className="font-medium">{trip.departureTimes.from}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Days:</div>
                  <div className="flex flex-wrap gap-1">
                    {trip.daysOfWeek.map((day) => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Created {new Date(trip.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by scheduling your first trip'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Trip
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update the trip information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tripName">Trip Name</Label>
              <Input
                id="edit-tripName"
                value={formData.tripName}
                onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-departureTimeTo">Departure Time (To)</Label>
                <Input
                  id="edit-departureTimeTo"
                  type="time"
                  value={formData.departureTimes.to}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    departureTimes: { ...prev.departureTimes, to: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-departureTimeFrom">Departure Time (From)</Label>
                <Input
                  id="edit-departureTimeFrom"
                  type="time"
                  value={formData.departureTimes.from}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    departureTimes: { ...prev.departureTimes, from: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${day}`}
                      checked={formData.daysOfWeek.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={`edit-${day}`} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTrip}>
                Update Trip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
