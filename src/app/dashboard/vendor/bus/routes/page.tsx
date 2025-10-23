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
import { 
  Bus, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  MoreHorizontal,
  Shield
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

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
  createdAt: string;
}

interface BusStop {
  _id: string;
  stopName: string;
  stopType: string;
  district: string;
}

interface BusFare {
  _id: string;
  routeName: string;
  origin: string;
  destination: string;
  fareAmount: number;
  currency: string;
}

export default function BusRoutesPage() {
  const { data: session } = useSession();
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [fares, setFares] = useState<BusFare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [selectedStops, setSelectedStops] = useState<BusStop[]>([]);
  const [formData, setFormData] = useState({
    routeName: '',
    totalDistance: '',
    status: 'active'
  });

  useEffect(() => {
    fetchRoutes();
    fetchStops();
    fetchFares();
  }, []);

  const fetchStops = async () => {
    try {
      const response = await fetch('/api/bus/stops');
      const data = await response.json();
      if (data.success) {
        setStops(data.stops || []);
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
    }
  };

  const fetchFares = async () => {
    try {
      const response = await fetch('/api/bus/fares');
      const data = await response.json();
      if (data.success) {
        setFares(data.fares || []);
      }
    } catch (error) {
      console.error('Error fetching fares:', error);
    }
  };

  const generateFareSegments = (stops: BusStop[]) => {
    const segments = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];
      
      // Find matching fare
      const fare = fares.find(f => 
        (f.origin === fromStop.stopName && f.destination === toStop.stopName) ||
        (f.origin === toStop.stopName && f.destination === fromStop.stopName)
      );
      
      if (fare) {
        segments.push({
          from: fromStop.stopName,
          to: toStop.stopName,
          fareId: fare._id,
          amount: fare.fareAmount
        });
      }
    }
    return segments;
  };

  const generateRouteName = (stops: BusStop[]) => {
    if (stops.length < 2) return '';
    return `${stops[0].stopName} - ${stops[stops.length - 1].stopName}`;
  };

  const addStopToRoute = (stop: BusStop) => {
    if (!selectedStops.find(s => s._id === stop._id)) {
      setSelectedStops([...selectedStops, stop]);
      // Auto-generate route name
      const newStops = [...selectedStops, stop];
      setFormData(prev => ({ ...prev, routeName: generateRouteName(newStops) }));
    }
  };

  const removeStopFromRoute = (index: number) => {
    const newStops = selectedStops.filter((_, i) => i !== index);
    setSelectedStops(newStops);
    setFormData(prev => ({ ...prev, routeName: generateRouteName(newStops) }));
  };

  const reorderStops = (fromIndex: number, toIndex: number) => {
    const newStops = [...selectedStops];
    const [removed] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, removed);
    setSelectedStops(newStops);
    setFormData(prev => ({ ...prev, routeName: generateRouteName(newStops) }));
  };

  const getFareRoutes = () => {
    // Return fares formatted as route segments
    return fares.map(fare => ({
      _id: fare._id,
      routeName: `${fare.origin} - ${fare.destination}`,
      origin: fare.origin,
      destination: fare.destination,
      fareAmount: fare.fareAmount,
      currency: fare.currency,
      fareId: fare._id
    }));
  };

  const addFareRouteToSelectedStops = (fareRoute: any) => {
    // Find the actual stop objects for origin and destination
    const originStop = stops.find(stop => stop.stopName === fareRoute.origin);
    const destinationStop = stops.find(stop => stop.stopName === fareRoute.destination);
    
    if (!originStop || !destinationStop) return;
    
    // Add both stops to the route if they're not already there
    const newStops = [...selectedStops];
    
    // Add origin if not already in route
    if (!newStops.find(s => s._id === originStop._id)) {
      newStops.push(originStop);
    }
    
    // Add destination if not already in route
    if (!newStops.find(s => s._id === destinationStop._id)) {
      newStops.push(destinationStop);
    }
    
    setSelectedStops(newStops);
    setFormData(prev => ({ ...prev, routeName: generateRouteName(newStops) }));
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bus/routes');
      const data = await response.json();

      if (data.success) {
        setRoutes(data.routes || []);
      } else {
        setError(data.error || 'Failed to load routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async () => {
    if (selectedStops.length < 2) {
      setError('Please select at least 2 stops for the route');
      return;
    }

    try {
      const fareSegments = generateFareSegments(selectedStops);
      
      const response = await fetch('/api/bus/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeName: formData.routeName,
          stops: selectedStops.map((stop, index) => ({
            stopId: stop._id,
            stopName: stop.stopName,
            order: index
          })),
          fareSegments,
          totalDistance: formData.totalDistance ? parseFloat(formData.totalDistance) : undefined,
          status: formData.status
        })
      });

      const data = await response.json();
      if (data.success) {
        setRoutes([...routes, data.route]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to add route');
      }
    } catch (error) {
      console.error('Error adding route:', error);
      setError('Failed to add route');
    }
  };

  const handleEditRoute = async () => {
    if (!editingRoute) return;

    if (selectedStops.length < 2) {
      setError('Please select at least 2 stops for the route');
      return;
    }

    try {
      const fareSegments = generateFareSegments(selectedStops);
      
      const response = await fetch(`/api/bus/routes/${editingRoute._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeName: formData.routeName,
          stops: selectedStops.map((stop, index) => ({
            stopId: stop._id,
            stopName: stop.stopName,
            order: index
          })),
          fareSegments,
          totalDistance: formData.totalDistance ? parseFloat(formData.totalDistance) : undefined,
          status: formData.status
        })
      });

      const data = await response.json();
      if (data.success) {
        setRoutes(routes.map(route => 
          route._id === editingRoute._id ? data.route : route
        ));
        setIsEditDialogOpen(false);
        setEditingRoute(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      setError('Failed to update route');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const response = await fetch(`/api/bus/routes/${routeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setRoutes(routes.filter(route => route._id !== routeId));
      } else {
        setError(data.error || 'Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      setError('Failed to delete route');
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      totalDistance: '',
      status: 'active'
    });
    setSelectedStops([]);
  };

  const openEditDialog = (route: BusRoute) => {
    setEditingRoute(route);
    setSelectedStops(route.stops.map(stop => ({
      _id: stop.stopId,
      stopName: stop.stopName,
      stopType: '',
      district: ''
    })));
    setFormData({
      routeName: route.routeName,
      totalDistance: route.totalDistance?.toString() || '',
      status: route.status
    });
    setIsEditDialogOpen(true);
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.stops.some(stop => stop.stopName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Session and permission checks
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view routes</p>
      </div>
    );
  }

  // Check if user has permission to access routes management
  const userRole = (session.user as { role?: string })?.role;
  if (!hasPermission(userRole || '', '/dashboard/vendor/bus/routes')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to access routes management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Routes</h1>
          <p className="text-gray-600 mt-1">Manage your bus routes and schedules</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Route</DialogTitle>
              <DialogDescription>
                Create a new bus route by selecting fare routes (e.g., Lusaka - Livingstone)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  value={formData.routeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, routeName: e.target.value }))}
                  placeholder="e.g., Lusaka-Livingstone Express"
                />
              </div>

              {/* Available Fare Routes */}
              <div>
                <Label>Available Fare Routes</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {getFareRoutes().map((fareRoute) => (
                    <Button
                      key={fareRoute._id}
                      variant="outline"
                      size="sm"
                      onClick={() => addFareRouteToSelectedStops(fareRoute)}
                      className="justify-between p-3 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">{fareRoute.routeName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{fareRoute.currency}</div>
                        <div className="font-semibold">{formatCurrency(fareRoute.fareAmount)}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                {getFareRoutes().length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No fare routes available</p>
                    <p className="text-xs">Create fares first to build routes</p>
                  </div>
                )}
              </div>

              {/* Selected Stops */}
              {selectedStops.length > 0 && (
                <div>
                  <Label>Route Stops (in order)</Label>
                  <div className="space-y-2 mt-2">
                    {selectedStops.map((stop, index) => (
                      <div key={stop._id} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="flex-1">{stop.stopName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStopFromRoute(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalDistance">Total Distance (km)</Label>
                  <Input
                    id="totalDistance"
                    type="number"
                    value={formData.totalDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalDistance: e.target.value }))}
                    placeholder="e.g., 450"
                  />
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
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fare Segments Preview */}
              {selectedStops.length >= 2 && (
                <div>
                  <Label>Fare Segments</Label>
                  <div className="space-y-1 mt-2 text-sm">
                    {generateFareSegments(selectedStops).map((segment, index) => (
                      <div key={index} className="flex justify-between p-2 rounded" style={{ backgroundColor: '#8B4513' }}>
                        <span className="text-white">{segment.from} → {segment.to}</span>
                        <span className="font-medium text-white">{formatCurrency(segment.amount)}</span>
                      </div>
                    ))}
                    {generateFareSegments(selectedStops).length === 0 && (
                      <div className="text-gray-500 p-2 bg-yellow-50 rounded">
                        No matching fares found for selected stops
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoute} disabled={selectedStops.length < 2}>
                  Add Route
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
                placeholder="Search routes..."
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
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

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map((route) => (
          <Card key={route._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{route.routeName}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(route.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(route)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoute(route._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {route.stops.map(stop => stop.stopName).join(' → ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{route.stops.length} stops</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>{route.fareSegments.length} fare segments</span>
                  </div>
                </div>
                {route.totalDistance && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{route.totalDistance} km total</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {route.isBidirectional ? 'Bidirectional' : 'One-way'}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Created {new Date(route.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first bus route'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Route
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update the route information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-routeName">Route Name</Label>
              <Input
                id="edit-routeName"
                value={formData.routeName}
                onChange={(e) => setFormData(prev => ({ ...prev, routeName: e.target.value }))}
              />
            </div>

            {/* Available Fare Routes */}
            <div>
              <Label>Available Fare Routes</Label>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                {getFareRoutes().map((fareRoute) => (
                  <Button
                    key={fareRoute._id}
                    variant="outline"
                    size="sm"
                    onClick={() => addFareRouteToSelectedStops(fareRoute)}
                    className="justify-between p-3 h-auto"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">{fareRoute.routeName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{fareRoute.currency}</div>
                      <div className="font-semibold">{formatCurrency(fareRoute.fareAmount)}</div>
                    </div>
                  </Button>
                ))}
              </div>
              {getFareRoutes().length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No fare routes available</p>
                  <p className="text-xs">Create fares first to build routes</p>
                </div>
              )}
            </div>

            {/* Selected Stops */}
            {selectedStops.length > 0 && (
              <div>
                <Label>Route Stops (in order)</Label>
                <div className="space-y-2 mt-2">
                  {selectedStops.map((stop, index) => (
                    <div key={stop._id} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="flex-1">{stop.stopName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStopFromRoute(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-totalDistance">Total Distance (km)</Label>
                <Input
                  id="edit-totalDistance"
                  type="number"
                  value={formData.totalDistance}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalDistance: e.target.value }))}
                />
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
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fare Segments Preview */}
            {selectedStops.length >= 2 && (
              <div>
                <Label>Fare Segments</Label>
                <div className="space-y-1 mt-2 text-sm">
                  {generateFareSegments(selectedStops).map((segment, index) => (
                    <div key={index} className="flex justify-between p-2 rounded" style={{ backgroundColor: '#8B4513' }}>
                      <span className="text-white">{segment.from} → {segment.to}</span>
                      <span className="font-medium text-white">{formatCurrency(segment.amount)}</span>
                    </div>
                  ))}
                  {generateFareSegments(selectedStops).length === 0 && (
                    <div className="text-gray-500 p-2 bg-yellow-50 rounded">
                      No matching fares found for selected stops
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRoute} disabled={selectedStops.length < 2}>
                Update Route
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
