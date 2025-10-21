'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bus,
  UserCheck,
  UserX,
  Clock3
} from 'lucide-react';

interface Passenger {
  _id: string;
  passengerId: string;
  passengerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    idNumber?: string;
    idType?: string;
  };
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  seatNumber: string;
  boardingPoint: string;
  droppingPoint: string;
  fareAmount: number;
  currency: string;
  departureDate: string;
  departureTime: string;
  status: string;
  paymentStatus: string;
  bookingType: string;
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
  departureTime: string;
}

interface Bus {
  _id: string;
  busName: string;
  busNumber: string;
  capacity: number;
}

const formatCurrency = (amount: number, currency: string = 'ZMW') => {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

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
    case 'confirmed':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    case 'onboard':
      return <UserCheck className="h-5 w-5 text-green-500" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'postponed':
      return <Clock3 className="h-5 w-5 text-orange-500" />;
    case 'no_show':
      return <UserX className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'onboard':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'postponed':
      return 'bg-orange-100 text-orange-800';
    case 'no_show':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function BusPassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, busFilter, tripFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (busFilter !== 'all') params.append('busId', busFilter);
      if (tripFilter !== 'all') params.append('tripId', tripFilter);
      if (dateFilter) params.append('date', dateFilter);

      const [bookingsResponse, tripsResponse, busesResponse] = await Promise.all([
        fetch(`/api/bus/bookings?${params.toString()}`),
        fetch('/api/bus/trips'),
        fetch('/api/bus/fleet')
      ]);

      const bookingsData = await bookingsResponse.json();
      const tripsData = await tripsResponse.json();
      const busesData = await busesResponse.json();

      if (bookingsData.success) {
        // Transform bookings data to passenger format
        const transformedPassengers = bookingsData.bookings.map((booking: any) => ({
          _id: booking._id,
          passengerId: booking._id,
          passengerDetails: booking.customerDetails || {
            firstName: booking.customerName?.split(' ')[0] || 'Unknown',
            lastName: booking.customerName?.split(' ').slice(1).join(' ') || 'Passenger',
            email: booking.customerEmail || 'N/A',
            phoneNumber: booking.customerPhone || 'N/A',
            idNumber: booking.customerIdNumber || '',
            idType: booking.customerIdType || ''
          },
          tripId: booking.tripId,
          tripName: booking.tripName || 'Unknown Trip',
          routeName: booking.routeName || 'Unknown Route',
          busId: booking.busId,
          busName: booking.busName || 'Unknown Bus',
          seatNumber: booking.seatNumbers?.[0] || 'N/A', // Take first seat if multiple
          boardingPoint: booking.boardingPoint || 'N/A',
          droppingPoint: booking.droppingPoint || 'N/A',
          fareAmount: booking.fareAmount || 0,
          currency: booking.currency || 'ZMW',
          departureDate: booking.departureDate || new Date().toISOString(),
          departureTime: booking.departureTime || '00:00',
          status: booking.status || 'confirmed',
          paymentStatus: booking.paymentStatus || 'pending',
          bookingType: booking.type || 'online',
          createdAt: booking.createdAt || new Date().toISOString(),
          updatedAt: booking.updatedAt || new Date().toISOString()
        }));
        setPassengers(transformedPassengers);
      } else {
        setError(bookingsData.error || 'Failed to load passengers');
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

  const filteredPassengers = passengers.filter(passenger => {
    // Add null checks for passengerDetails
    if (!passenger.passengerDetails) {
      console.warn('Passenger with missing details:', passenger._id);
      return false;
    }

    const matchesSearch = 
      (passenger.passengerDetails.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (passenger.passengerDetails.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (passenger.passengerDetails.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (passenger.passengerDetails.phoneNumber?.includes(searchTerm) || false) ||
      (passenger.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (passenger.busName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (passenger.seatNumber?.includes(searchTerm) || false);

    return matchesSearch;
  });

  const handleStatusChange = async (passengerId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/bus/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: passengerId, status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        // Update the passenger in the local state
        setPassengers(passengers.map(passenger => 
          passenger._id === passengerId ? { ...passenger, status: newStatus } : passenger
        ));
      } else {
        setError(data.error || 'Failed to update passenger status');
      }
    } catch (error) {
      console.error('Error updating passenger status:', error);
      setError('Failed to update passenger status');
    }
  };

  const getUniqueBuses = () => {
    const uniqueBuses = buses.filter((bus, index, self) => 
      index === self.findIndex(b => b._id === bus._id)
    );
    return uniqueBuses.sort((a, b) => a.busName.localeCompare(b.busName));
  };

  const getUniqueTrips = () => {
    const uniqueTrips = trips.filter((trip, index, self) => 
      index === self.findIndex(t => t._id === trip._id)
    );
    return uniqueTrips.sort((a, b) => a.tripName.localeCompare(b.tripName));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading passengers...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Passengers</h1>
          <p className="text-gray-600 mt-1">Manage passenger status by route and trip</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {passengers.length} Total
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passengers.length}</div>
            <p className="text-xs text-muted-foreground">All passengers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboard</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.status === 'onboard').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently onboard</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Journey completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postponed</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.status === 'postponed').length}
            </div>
            <p className="text-xs text-muted-foreground">Journey postponed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search passengers..."
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="onboard">Onboard</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
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
            <Select value={tripFilter} onValueChange={setTripFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by trip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                {getUniqueTrips().map((trip) => (
                  <SelectItem key={trip._id} value={trip._id}>
                    {trip.tripName}
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

      {/* Passengers List */}
      <div className="space-y-4">
        {filteredPassengers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No passengers found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || busFilter !== 'all' || tripFilter !== 'all' || dateFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'No passengers have been booked yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPassengers.map((passenger) => (
            <Card key={passenger._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(passenger.status)}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {passenger.passengerDetails?.firstName || 'Unknown'} {passenger.passengerDetails?.lastName || 'Passenger'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {passenger.busName} - {passenger.tripName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{passenger.passengerDetails?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{passenger.passengerDetails?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{passenger.boardingPoint} → {passenger.droppingPoint}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(passenger.fareAmount, passenger.currency)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(passenger.status)}>
                          {passenger.status}
                        </Badge>
                        <Badge variant="outline">
                          Seat {passenger.seatNumber}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={passenger.status}
                        onValueChange={(value) => handleStatusChange(passenger._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="onboard">Onboard</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="postponed">Postponed</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
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
                    <div className="text-gray-600">{passenger.routeName}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Departure:</span>
                    </div>
                    <div className="text-gray-600">
                      {formatDate(passenger.departureDate)} at {formatTime(passenger.departureTime)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Bus className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Bus:</span>
                    </div>
                    <div className="text-gray-600">{passenger.busName}</div>
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