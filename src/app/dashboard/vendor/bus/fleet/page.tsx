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
import { Switch } from '@/components/ui/switch';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Users
} from 'lucide-react';

interface Bus {
  _id: string;
  busName: string;
  busNumberPlate: string;
  numberOfSeats: number;
  busType: string;
  hasAC: boolean;
  image?: string;
  status: string;
  createdAt: string;
}

export default function BusFleetPage() {
  const { data: session } = useSession();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({
    busName: '',
    busNumberPlate: '',
    numberOfSeats: '',
    busType: '',
    hasAC: false,
    image: '',
    status: 'active'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bus/fleet');
      const data = await response.json();

      if (data.success) {
        setBuses(data.buses || []);
      } else {
        setError(data.error || 'Failed to load buses');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      setError('Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBus = async () => {
    try {
      let imageUrl = '';
      
      // Upload image if file is selected
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formDataUpload
        });
        
        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          imageUrl = uploadData.url;
        }
      }

      const response = await fetch('/api/bus/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          numberOfSeats: parseInt(formData.numberOfSeats),
          hasAC: formData.hasAC,
          image: imageUrl || formData.image
        })
      });

      const data = await response.json();
      if (data.success) {
        setBuses([...buses, data.bus]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to add bus');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      setError('Failed to add bus');
    }
  };

  const handleEditBus = async () => {
    if (!editingBus) return;

    try {
      let imageUrl = formData.image;
      
      // Upload new image if file is selected
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formDataUpload
        });
        
        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          imageUrl = uploadData.url;
        }
      }

      const response = await fetch(`/api/bus/fleet/${editingBus._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          numberOfSeats: parseInt(formData.numberOfSeats),
          hasAC: formData.hasAC,
          image: imageUrl
        })
      });

      const data = await response.json();
      if (data.success) {
        setBuses(buses.map(bus => 
          bus._id === editingBus._id ? data.bus : bus
        ));
        setIsEditDialogOpen(false);
        setEditingBus(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update bus');
      }
    } catch (error) {
      console.error('Error updating bus:', error);
      setError('Failed to update bus');
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;

    try {
      const response = await fetch(`/api/bus/fleet/${busId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setBuses(buses.filter(bus => bus._id !== busId));
      } else {
        setError(data.error || 'Failed to delete bus');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      setError('Failed to delete bus');
    }
  };

  const resetForm = () => {
    setFormData({
      busName: '',
      busNumberPlate: '',
      numberOfSeats: '',
      busType: '',
      hasAC: false,
      image: '',
      status: 'active'
    });
    setImageFile(null);
    setImagePreview('');
  };

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      busName: bus.busName,
      busNumberPlate: bus.busNumberPlate,
      numberOfSeats: bus.numberOfSeats.toString(),
      busType: bus.busType,
      hasAC: bus.hasAC,
      image: bus.image || '',
      status: bus.status
    });
    setImageFile(null);
    setImagePreview(bus.image || '');
    setIsEditDialogOpen(true);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.busNumberPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.busType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      maintenance: 'destructive',
      inactive: 'secondary',
      retired: 'outline'
    } as const;

    const colors = {
      active: 'text-green-600',
      maintenance: 'text-red-600',
      inactive: 'text-gray-600',
      retired: 'text-gray-500'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <span className={colors[status as keyof typeof colors] || 'text-gray-600'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Manage your bus fleet and maintenance</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Bus</DialogTitle>
              <DialogDescription>
                Register a new bus in your fleet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="busName">Bus Name</Label>
                  <Input
                    id="busName"
                    value={formData.busName}
                    onChange={(e) => setFormData(prev => ({ ...prev, busName: e.target.value }))}
                    placeholder="e.g., City Express"
                  />
                </div>
                <div>
                  <Label htmlFor="busNumberPlate">Number Plate</Label>
                  <Input
                    id="busNumberPlate"
                    value={formData.busNumberPlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, busNumberPlate: e.target.value }))}
                    placeholder="e.g., ABC 1234"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numberOfSeats">Number of Seats</Label>
                  <Input
                    id="numberOfSeats"
                    type="number"
                    value={formData.numberOfSeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfSeats: e.target.value }))}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <Label htmlFor="busType">Bus Type</Label>
                  <Select value={formData.busType} onValueChange={(value) => setFormData(prev => ({ ...prev, busType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="mini">Mini Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="image">Bus Image</Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                  <p className="text-sm text-gray-500">
                    Upload a bus image (max 5MB, JPG, PNG, GIF)
                  </p>
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Bus preview" 
                      className="w-32 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="hasAC">Air Conditioning</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasAC"
                    checked={formData.hasAC}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAC: checked }))}
                  />
                  <Label htmlFor="hasAC" className="text-sm">
                    {formData.hasAC ? 'AC Bus' : 'Non-AC Bus'}
                  </Label>
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
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBus}>
                  Add Bus
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
            <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buses.length}</div>
            <p className="text-xs text-muted-foreground">
              Fleet size
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
              {buses.filter(b => b.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              In service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buses.filter(b => b.status === 'maintenance').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under repair
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search buses..."
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
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

      {/* Buses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuses.map((bus) => (
          <Card key={bus._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{bus.busName}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(bus.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(bus)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBus(bus._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {bus.busNumberPlate} • {bus.busType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bus.image && (
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={bus.image} 
                      alt={bus.busName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{bus.numberOfSeats} seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="capitalize">{bus.busType}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={bus.hasAC ? "default" : "secondary"} className="text-xs">
                    {bus.hasAC ? 'AC' : 'Non-AC'}
                  </Badge>
                  <span className="text-gray-500 text-xs">
                    {bus.busNumberPlate}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Added {formatDate(bus.createdAt)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBuses.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No buses found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first bus to the fleet'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Bus
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bus</DialogTitle>
            <DialogDescription>
              Update the bus information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-busName">Bus Name</Label>
                <Input
                  id="edit-busName"
                  value={formData.busName}
                  onChange={(e) => setFormData(prev => ({ ...prev, busName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-busNumberPlate">Number Plate</Label>
                <Input
                  id="edit-busNumberPlate"
                  value={formData.busNumberPlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, busNumberPlate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-numberOfSeats">Number of Seats</Label>
                <Input
                  id="edit-numberOfSeats"
                  type="number"
                  value={formData.numberOfSeats}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfSeats: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-busType">Bus Type</Label>
                <Select value={formData.busType} onValueChange={(value) => setFormData(prev => ({ ...prev, busType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="mini">Mini Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-image">Bus Image</Label>
              <div className="space-y-2">
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                <p className="text-sm text-gray-500">
                  Upload a new bus image (max 5MB, JPG, PNG, GIF)
                </p>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Bus preview" 
                    className="w-32 h-20 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-hasAC">Air Conditioning</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-hasAC"
                  checked={formData.hasAC}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAC: checked }))}
                />
                <Label htmlFor="edit-hasAC" className="text-sm">
                  {formData.hasAC ? 'AC Bus' : 'Non-AC Bus'}
                </Label>
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
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditBus}>
                Update Bus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
