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
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  Bus
} from 'lucide-react';

interface BusFare {
  _id: string;
  routeName: string;
  origin: string;
  destination: string;
  fareAmount: number;
  currency: string;
  discount: number;
  status: string;
  createdAt: string;
}

interface BusStop {
  _id: string;
  stopName: string;
  stopType: string;
  district: string;
}

export default function BusFaresPage() {
  const { data: session } = useSession();
  const [fares, setFares] = useState<BusFare[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFare, setEditingFare] = useState<BusFare | null>(null);
  const [formData, setFormData] = useState({
    routeName: '',
    origin: '',
    destination: '',
    fareAmount: '',
    currency: 'ZMW',
    discount: '0',
    status: 'active'
  });

  useEffect(() => {
    fetchFares();
    fetchStops();
  }, []);

  const fetchFares = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bus/fares');
      const data = await response.json();
      
      if (data.success) {
        setFares(data.fares);
      } else {
        setError(data.error || 'Failed to fetch fares');
      }
    } catch (error) {
      console.error('Error fetching fares:', error);
      setError('Failed to fetch fares');
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async () => {
    try {
      const response = await fetch('/api/bus/stops');
      const data = await response.json();
      
      if (data.success) {
        setStops(data.stops);
      } else {
        console.error('Failed to fetch stops:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
    }
  };

  const updateRouteName = (origin: string, destination: string) => {
    if (origin && destination) {
      const originStop = stops.find(s => s.stopName === origin);
      const destStop = stops.find(s => s.stopName === destination);
      if (originStop && destStop) {
        return `${origin} - ${destination}`;
      }
    }
    return '';
  };

  const handleOriginChange = (value: string) => {
    setFormData(prev => {
      const newOrigin = value;
      const routeName = updateRouteName(newOrigin, prev.destination);
      return { ...prev, origin: newOrigin, routeName };
    });
  };

  const handleDestinationChange = (value: string) => {
    setFormData(prev => {
      const newDestination = value;
      const routeName = updateRouteName(prev.origin, newDestination);
      return { ...prev, destination: newDestination, routeName };
    });
  };

  const handleAddFare = async () => {
    try {
      const response = await fetch('/api/bus/fares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fareAmount: parseFloat(formData.fareAmount),
          discount: parseFloat(formData.discount)
        })
      });

      const data = await response.json();
      if (data.success) {
        setFares([...fares, data.fare]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to add fare');
      }
    } catch (error) {
      console.error('Error adding fare:', error);
      setError('Failed to add fare');
    }
  };

  const handleEditFare = async () => {
    if (!editingFare) return;

    try {
      const response = await fetch(`/api/bus/fares/${editingFare._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fareAmount: parseFloat(formData.fareAmount),
          discount: parseFloat(formData.discount)
        })
      });

      const data = await response.json();
      if (data.success) {
        setFares(fares.map(fare => 
          fare._id === editingFare._id ? data.fare : fare
        ));
        setIsEditDialogOpen(false);
        setEditingFare(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update fare');
      }
    } catch (error) {
      console.error('Error updating fare:', error);
      setError('Failed to update fare');
    }
  };

  const handleDeleteFare = async (fareId: string) => {
    if (!confirm('Are you sure you want to delete this fare?')) return;

    try {
      const response = await fetch(`/api/bus/fares/${fareId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setFares(fares.filter(fare => fare._id !== fareId));
      } else {
        setError(data.error || 'Failed to delete fare');
      }
    } catch (error) {
      console.error('Error deleting fare:', error);
      setError('Failed to delete fare');
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      origin: '',
      destination: '',
      fareAmount: '',
      currency: 'ZMW',
      discount: '0',
      status: 'active'
    });
  };

  const openEditDialog = (fare: BusFare) => {
    setEditingFare(fare);
    setFormData({
      routeName: fare.routeName,
      origin: fare.origin,
      destination: fare.destination,
      fareAmount: fare.fareAmount.toString(),
      currency: fare.currency,
      discount: fare.discount.toString(),
      status: fare.status
    });
    setIsEditDialogOpen(true);
  };

  const filteredFares = fares.filter(fare => {
    const matchesSearch = fare.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fare.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fare.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      seasonal: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateDiscountedFare = (amount: number, discount: number) => {
    return amount - (amount * discount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM');
  };

  // Calculate statistics
  const averageFare = fares.length > 0 
    ? fares.reduce((sum, fare) => sum + fare.fareAmount, 0) / fares.length 
    : 0;
  const totalRoutes = new Set(fares.map(fare => fare.routeName)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bus Fares</h1>
          <p className="text-muted-foreground">
            Manage ticket pricing for your routes
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fare
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Fare</DialogTitle>
              <DialogDescription>
                Set pricing for a route
              </DialogDescription>
            </DialogHeader>
            {stops.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No stops available</h3>
                <p className="text-gray-500 mb-4">
                  You need to create bus stops first before adding fares.
                </p>
                <Button onClick={() => {
                  setIsAddDialogOpen(false);
                  window.location.href = '/dashboard/vendor/bus/stops';
                }}>
                  Go to Stops Page
                </Button>
              </div>
            ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">From (Origin)</Label>
                  <Select value={formData.origin} onValueChange={handleOriginChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin stop" />
                    </SelectTrigger>
                    <SelectContent>
                      {stops.map((stop) => (
                        <SelectItem key={stop._id} value={stop.stopName}>
                          {stop.stopName} ({stop.stopType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="destination">To (Destination)</Label>
                  <Select value={formData.destination} onValueChange={handleDestinationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination stop" />
                    </SelectTrigger>
                    <SelectContent>
                      {stops
                        .filter(stop => stop.stopName !== formData.origin)
                        .map((stop) => (
                          <SelectItem key={stop._id} value={stop.stopName}>
                            {stop.stopName} ({stop.stopType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.routeName && (
                  <div className="col-span-2">
                    <Label>Route Name</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm">
                      {formData.routeName}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fareAmount">Fare Amount</Label>
                  <Input
                    id="fareAmount"
                    type="number"
                    step="0.01"
                    value={formData.fareAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, fareAmount: e.target.value }))}
                    placeholder="e.g., 150.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZMW">ZMW</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="e.g., 10"
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
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddFare}>
                  Add Fare
                </Button>
              </div>
            </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fares</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fares.length}</div>
            <p className="text-xs text-muted-foreground">
              Active pricing rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fare</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageFare, 'ZMW')}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              With pricing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search fares..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Fares Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFares.map((fare) => (
          <Card key={fare._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{fare.routeName}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(fare.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(fare)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFare(fare._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {fare.origin} → {fare.destination}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(fare.fareAmount, fare.currency)}
                  </span>
                  {fare.discount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {fare.discount}% off
                    </Badge>
                  )}
                </div>
                {fare.discount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Discounted: {formatCurrency(calculateDiscountedFare(fare.fareAmount, fare.discount), fare.currency)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(fare.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFares.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No fares found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first fare'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Fare
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fare</DialogTitle>
            <DialogDescription>
              Update the fare information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-origin">From (Origin)</Label>
                <Select value={formData.origin} onValueChange={handleOriginChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stops.map((stop) => (
                      <SelectItem key={stop._id} value={stop.stopName}>
                        {stop.stopName} ({stop.stopType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-destination">To (Destination)</Label>
                <Select value={formData.destination} onValueChange={handleDestinationChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stops
                      .filter(stop => stop.stopName !== formData.origin)
                      .map((stop) => (
                        <SelectItem key={stop._id} value={stop.stopName}>
                          {stop.stopName} ({stop.stopType})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.routeName && (
                <div className="col-span-2">
                  <Label>Route Name</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm">
                    {formData.routeName}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fareAmount">Fare Amount</Label>
                <Input
                  id="edit-fareAmount"
                  type="number"
                  step="0.01"
                  value={formData.fareAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, fareAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZMW">ZMW</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount">Discount (%)</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
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
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditFare}>
                Update Fare
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
