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
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Map
} from 'lucide-react';

interface BusStop {
  _id: string;
  stopName: string;
  stopType: string;
  district: string;
  status: string;
  createdAt: string;
}

export default function BusStopsPage() {
  const { data: session } = useSession();
  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [formData, setFormData] = useState({
    stopName: '',
    stopType: '',
    district: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bus/stops');
      const data = await response.json();
      
      if (data.success) {
        setStops(data.stops);
      } else {
        setError(data.error || 'Failed to fetch stops');
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
      setError('Failed to fetch stops');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStop = async () => {
    try {
      const response = await fetch('/api/bus/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setStops([...stops, data.stop]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to add stop');
      }
    } catch (error) {
      console.error('Error adding stop:', error);
      setError('Failed to add stop');
    }
  };

  const handleEditStop = async () => {
    if (!editingStop) return;

    try {
      const response = await fetch(`/api/bus/stops/${editingStop._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setStops(stops.map(stop => 
          stop._id === editingStop._id ? data.stop : stop
        ));
        setIsEditDialogOpen(false);
        setEditingStop(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update stop');
      }
    } catch (error) {
      console.error('Error updating stop:', error);
      setError('Failed to update stop');
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Are you sure you want to delete this stop?')) return;

    try {
      const response = await fetch(`/api/bus/stops/${stopId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setStops(stops.filter(stop => stop._id !== stopId));
      } else {
        setError(data.error || 'Failed to delete stop');
      }
    } catch (error) {
      console.error('Error deleting stop:', error);
      setError('Failed to delete stop');
    }
  };

  const resetForm = () => {
    setFormData({
      stopName: '',
      stopType: '',
      district: '',
      status: 'active'
    });
  };

  const openEditDialog = (stop: BusStop) => {
    setEditingStop(stop);
    setFormData({
      stopName: stop.stopName,
      stopType: stop.stopType,
      district: stop.district,
      status: stop.status
    });
    setIsEditDialogOpen(true);
  };

  const filteredStops = stops.filter(stop => {
    const matchesSearch = stop.stopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stop.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || stop.stopType === typeFilter;
    const matchesDistrict = districtFilter === 'all' || stop.district === districtFilter;
    return matchesSearch && matchesType && matchesDistrict;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'terminal':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'stop':
        return <MapPin className="h-4 w-4 text-green-600" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM');
  };

  // Get unique districts for filter
  const districts = [...new Set(stops.map(stop => stop.district))].sort();

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
          <h1 className="text-3xl font-bold">Bus Stops</h1>
          <p className="text-muted-foreground">
            Manage bus stops and terminals
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stop</DialogTitle>
              <DialogDescription>
                Add a new bus stop or terminal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stopName">Stop Name</Label>
                <Input
                  id="stopName"
                  value={formData.stopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, stopName: e.target.value }))}
                  placeholder="e.g., Lusaka Central Station"
                />
              </div>
              <div>
                <Label htmlFor="stopType">Stop Type</Label>
                <Select value={formData.stopType} onValueChange={(value) => setFormData(prev => ({ ...prev, stopType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stop type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stop">Stop</SelectItem>
                    <SelectItem value="terminal">Terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="e.g., Lusaka"
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStop}>
                  Add Stop
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stops.length}</div>
            <p className="text-xs text-muted-foreground">
              All stops and terminals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stops.filter(s => s.stopType === 'terminal').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Major terminals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stops.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              In service
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
                  placeholder="Search stops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stop">Stops</SelectItem>
                  <SelectItem value="terminal">Terminals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStops.map((stop) => (
          <Card key={stop._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{stop.stopName}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(stop.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(stop)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStop(stop._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {stop.district} • {stop.stopType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(stop.stopType)}
                    <span className="capitalize">{stop.stopType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-gray-400" />
                    <span>{stop.district}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Added {formatDate(stop.createdAt)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStops.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stops found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter !== 'all' || districtFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first bus stop'}
          </p>
          {!searchTerm && typeFilter === 'all' && districtFilter === 'all' && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Stop
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stop</DialogTitle>
            <DialogDescription>
              Update the stop information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-stopName">Stop Name</Label>
              <Input
                id="edit-stopName"
                value={formData.stopName}
                onChange={(e) => setFormData(prev => ({ ...prev, stopName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-stopType">Stop Type</Label>
              <Select value={formData.stopType} onValueChange={(value) => setFormData(prev => ({ ...prev, stopType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stop">Stop</SelectItem>
                  <SelectItem value="terminal">Terminal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-district">District</Label>
              <Input
                id="edit-district"
                value={formData.district}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
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
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStop}>
                Update Stop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}