'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bus, 
  Search,
  Filter,
  Plus,
  MapPin,
  Clock,
  Users,
  User,
  Phone,
  Package,
  DollarSign,
  Wrench,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  Calendar,
  Route
} from 'lucide-react';

interface Dispatch {
  _id: string;
  dispatchId: string;
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  busNumber: string;
  driverId?: string;
  driverName?: string;
  conductorId?: string;
  conductorName?: string;
  departureDate: string;
  dispatchStop: string;
  receiverContact: string;
  parcelDescription: string;
  parcelValue: number;
  billedPrice: number;
  actualDeparture?: string;
  actualArrival?: string;
  status: string;
  passengers: Array<{
    passengerId: string;
    passengerName: string;
    seatNumber: string;
    boardingPoint: string;
    droppingPoint: string;
    status: string;
  }>;
  totalPassengers: number;
  onboardPassengers: number;
  completedPassengers: number;
  noShowPassengers: number;
  maintenanceStatus: string;
  notes?: string;
  dispatchedBy: string;
  dispatchedByName: string;
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  _id: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  departureDate: string;
}

interface Bus {
  _id: string;
  busName: string;
  busNumber: string;
  capacity: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-ZM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  return timeString;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'boarding':
      return <Users className="h-5 w-5 text-yellow-500" />;
    case 'departed':
      return <Play className="h-5 w-5 text-green-500" />;
    case 'in_transit':
      return <Bus className="h-5 w-5 text-green-600" />;
    case 'arrived':
      return <CheckCircle className="h-5 w-5 text-green-700" />;
    case 'delayed':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    case 'cancelled':
      return <Square className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'boarding':
      return 'bg-yellow-100 text-yellow-800';
    case 'departed':
      return 'bg-green-100 text-green-800';
    case 'in_transit':
      return 'bg-green-100 text-green-800';
    case 'arrived':
      return 'bg-green-100 text-green-800';
    case 'delayed':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getMaintenanceColor = (status: string) => {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'needs_check':
      return 'text-yellow-500';
    case 'maintenance_required':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export default function BusSendingPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Helper function to clear missing field when user starts typing
  const clearFieldError = (fieldName: string) => {
    setMissingFields(prev => prev.filter(field => field !== fieldName));
  };

  // Helper function to check if a field is missing
  const isFieldMissing = (fieldName: string) => {
    return missingFields.includes(fieldName);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);

  // Form state for creating dispatch
  const [formData, setFormData] = useState({
    tripId: '',
    tripName: '',
    routeName: '',
    busId: '',
    busName: '',
    busNumber: '',
    driverId: '',
    driverName: '',
    conductorId: '',
    conductorName: '',
    departureDate: '',
    dispatchStop: '',
    receiverContact: '',
    parcelDescription: '',
    parcelValue: '0',
    billedPrice: '0',
    maintenanceStatus: 'good',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, busFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (busFilter !== 'all') params.append('busId', busFilter);
      if (dateFilter) params.append('date', dateFilter);

      const [dispatchesResponse, tripsResponse, busesResponse] = await Promise.all([
        fetch(`/api/bus/sending?${params.toString()}`),
        fetch('/api/bus/trips'),
        fetch('/api/bus/fleet')
      ]);

      const dispatchesData = await dispatchesResponse.json();
      const tripsData = await tripsResponse.json();
      const busesData = await busesResponse.json();

      if (dispatchesData.success) {
        setDispatches(dispatchesData.dispatches || []);
      } else {
        setError(dispatchesData.error || 'Failed to load dispatches');
      }

      if (tripsData.success) {
        setTrips(tripsData.trips || []);
      }

      if (busesData.success) {
        setBuses(busesData.buses || []);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = 
      dispatch.dispatchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dispatch.driverName && dispatch.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dispatch.conductorName && dispatch.conductorName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const handleCreateDispatch = async () => {
    try {
      // Validate required fields
      const missingFields = [];
      if (!formData.tripId) missingFields.push('Trip');
      if (!formData.departureDate) missingFields.push('Departure Date');
      if (!formData.dispatchStop) missingFields.push('Dispatch Stop');
      if (!formData.receiverContact) missingFields.push('Receiver Contact');
      if (!formData.parcelDescription) missingFields.push('Parcel Description');
      
      if (missingFields.length > 0) {
        setMissingFields(missingFields);
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Clear missing fields if validation passes
      setMissingFields([]);

      // Validate parcel values
      const parcelValue = parseFloat(formData.parcelValue);
      const billedPrice = parseFloat(formData.billedPrice);
      
      if (isNaN(parcelValue) || parcelValue < 0) {
        setError('Please enter a valid parcel value');
        return;
      }
      
      if (isNaN(billedPrice) || billedPrice < 0) {
        setError('Please enter a valid billed price');
        return;
      }

      // Additional validation for trip-related fields
      if (!formData.tripName || !formData.routeName || !formData.busId || !formData.busName) {
        setError('Please select a valid trip');
        return;
      }

      console.log('Frontend validation passed. Form data:', formData);

      const requestData = {
        ...formData,
        parcelValue: parcelValue,
        billedPrice: billedPrice
      };
      
      console.log('Sending data to API:', requestData);
      console.log('Bus number being sent:', requestData.busNumber);
      console.log('Form data before sending:', formData);

      const response = await fetch('/api/bus/sending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      if (data.success) {
        setDispatches([data.dispatch, ...dispatches]);
        setIsCreateDialogOpen(false);
        setFormData({
          tripId: '',
          tripName: '',
          routeName: '',
          busId: '',
          busNumber: '',
          busNumber: '',
          driverId: '',
          driverName: '',
          conductorId: '',
          conductorName: '',
          departureDate: '',
          departureTime: '',
          dispatchStop: '',
          receiverContact: '',
          parcelDescription: '',
          parcelValue: '0',
          billedPrice: '0',
          maintenanceStatus: 'good',
          notes: ''
        });
        setError('');
        setMissingFields([]);
      } else {
        setError(data.error || 'Failed to create dispatch');
      }
    } catch (error) {
      console.error('Error creating dispatch:', error);
      setError('Failed to create dispatch');
    }
  };

  const handleStatusUpdate = async (dispatchId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/bus/sending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId, status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setDispatches(dispatches.map(dispatch => 
          dispatch._id === dispatchId ? data.dispatch : dispatch
        ));
      } else {
        setError(data.error || 'Failed to update dispatch status');
      }
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      setError('Failed to update dispatch status');
    }
  };

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find(t => t._id === tripId);
    if (trip) {
      // Find the bus details from the buses array
      let bus = buses.find(b => b._id === trip.busId);
      
      // If not found by ID, try to find by bus name
      if (!bus) {
        bus = buses.find(b => b.busName === trip.busName);
      }
      
      console.log('Selected trip:', trip);
      console.log('Found bus:', bus);
      console.log('Bus number plate:', bus?.busNumberPlate);
      
      setFormData(prev => ({
        ...prev,
        tripId: trip._id,
        tripName: trip.tripName,
        routeName: trip.routeName,
        busId: trip.busId,
        busName: trip.busName, // Display bus name in form
        busNumber: bus?.busNumberPlate || '' // Store bus number for API
      }));
      clearFieldError('Trip');
    }
  };

  const getUniqueBuses = () => {
    const uniqueBuses = buses.filter((bus, index, self) => 
      index === self.findIndex(b => b._id === bus._id)
    );
    return uniqueBuses.sort((a, b) => a.busName.localeCompare(b.busName));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dispatches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Sending</h1>
          <p className="text-gray-600 mt-1">Manage bus dispatch and tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dispatch Bus
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Dispatch Bus</DialogTitle>
                <DialogDescription>
                  Create a new bus dispatch for a scheduled trip
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Trip <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.tripId || ''} onValueChange={handleTripSelect}>
                    <SelectTrigger className={isFieldMissing('Trip') ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip._id} value={trip._id}>
                          {trip.tripName} - {trip.routeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Bus</label>
                  <Input
                    value={formData.busName || ''}
                    disabled
                    placeholder="Auto-selected from trip"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Driver Name</label>
                  <Input
                    value={formData.driverName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value || '' }))}
                    placeholder="Enter driver name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conductor Name</label>
                  <Input
                    value={formData.conductorName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, conductorName: e.target.value || '' }))}
                    placeholder="Enter conductor name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.departureDate || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, departureDate: e.target.value || '' }));
                      clearFieldError('Departure Date');
                    }}
                    className={isFieldMissing('Departure Date') ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Dispatch Stop <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.dispatchStop || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dispatchStop: e.target.value || '' }));
                      clearFieldError('Dispatch Stop');
                    }}
                    placeholder="Enter dispatch stop location"
                    className={isFieldMissing('Dispatch Stop') ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Receiver Contact <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.receiverContact || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, receiverContact: e.target.value || '' }));
                      clearFieldError('Receiver Contact');
                    }}
                    placeholder="Enter receiver contact number"
                    className={isFieldMissing('Receiver Contact') ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Maintenance Status</label>
                  <Select value={formData.maintenanceStatus || 'good'} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenanceStatus: value || 'good' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs_check">Needs Check</SelectItem>
                      <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Parcel Description <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.parcelDescription || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, parcelDescription: e.target.value || '' }));
                      clearFieldError('Parcel Description');
                    }}
                    placeholder="Describe what is being sent"
                    className={isFieldMissing('Parcel Description') ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parcel Value (ZMW)</label>
                  <Input
                    type="number"
                    value={formData.parcelValue || '0'}
                    onChange={(e) => setFormData(prev => ({ ...prev, parcelValue: e.target.value || '0' }))}
                    placeholder="Enter parcel value"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Billed Price (ZMW)</label>
                  <Input
                    type="number"
                    value={formData.billedPrice || '0'}
                    onChange={(e) => setFormData(prev => ({ ...prev, billedPrice: e.target.value || '0' }))}
                    placeholder="Enter billed price"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || '' }))}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDispatch}>
                  Dispatch Bus
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatches.length}</div>
            <p className="text-xs text-muted-foreground">All dispatches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dispatches.filter(d => d.status === 'in_transit').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently traveling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrived</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dispatches.filter(d => d.status === 'arrived').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dispatches.filter(d => d.status === 'delayed').length}
            </div>
            <p className="text-xs text-muted-foreground">Running behind schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search dispatches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="boarding">Boarding</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={busFilter} onValueChange={setBusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by bus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buses</SelectItem>
                {getUniqueBuses().map((bus) => (
                  <SelectItem key={bus._id} value={bus._id}>
                    {bus.busName} ({bus.busNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dispatches List */}
      <div className="space-y-4">
        {filteredDispatches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dispatches found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || busFilter !== 'all' || dateFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'No bus dispatches have been created yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDispatches.map((dispatch) => (
            <Card key={dispatch._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(dispatch.status)}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {dispatch.dispatchId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dispatch.tripName} - {dispatch.routeName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Bus className="h-4 w-4" />
                        <span>{dispatch.busName} ({dispatch.busNumber})</span>
                      </div>
                      {dispatch.driverName && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{dispatch.driverName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(dispatch.departureDate)} {formatTime(dispatch.departureTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getStatusColor(dispatch.status)}>
                          {dispatch.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-xs">{dispatch.dispatchStop}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Wrench className={`h-4 w-4 ${getMaintenanceColor(dispatch.maintenanceStatus)}`} />
                          <span className="text-xs">{dispatch.maintenanceStatus}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {dispatch.totalPassengers} passengers | Parcel: {formatCurrency(dispatch.parcelValue)} | Billed: {formatCurrency(dispatch.billedPrice)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={dispatch.status}
                        onValueChange={(value) => handleStatusUpdate(dispatch._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="boarding">Boarding</SelectItem>
                          <SelectItem value="departed">Departed</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="arrived">Arrived</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Route:</span>
                    </div>
                    <div className="text-gray-600">{dispatch.routeName}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Dispatch Stop:</span>
                    </div>
                    <div className="text-gray-600">{dispatch.dispatchStop}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Receiver Contact:</span>
                    </div>
                    <div className="text-gray-600">{dispatch.receiverContact}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Parcel:</span>
                    </div>
                    <div className="text-gray-600">{dispatch.parcelDescription}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Value & Price:</span>
                    </div>
                    <div className="text-gray-600">
                      Value: {formatCurrency(dispatch.parcelValue)} | Billed: {formatCurrency(dispatch.billedPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Dispatched:</span>
                    </div>
                    <div className="text-gray-600">
                      {formatDate(dispatch.createdAt)} by {dispatch.dispatchedByName}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
