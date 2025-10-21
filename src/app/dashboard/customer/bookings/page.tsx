'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Filter, Search, Download, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Booking {
  _id: string;
  bookingType: 'hotel' | 'bus' | 'store' | 'pharmacy';
  serviceName: string;
  hotelName?: string;
  bookingDate: string;
  checkInDate?: string;
  checkOutDate?: string;
  travelDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amount: number;
  currency: string;
  guestCount?: number;
  roomType?: string;
  roomNumber?: string;
  seatNumber?: string;
  routeName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/customer/bookings');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = (booking.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (booking.bookingType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.bookingType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'bus': return '🚌';
      case 'store': return '🛍️';
      case 'pharmacy': return '💊';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-green-800 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-green-200 mt-2">View and manage all your bookings</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-200">Total Bookings</p>
          <p className="text-2xl font-bold text-green-300">{bookings.length}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-green-700 border-green-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-200">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-200">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-200">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <Card className="bg-green-700 border-green-600">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
              <p className="text-green-200">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t made any bookings yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking._id} className="hover:shadow-md transition-shadow bg-green-800 border-green-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{getBookingIcon(booking.bookingType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {booking.serviceName || 'Unknown Service'}
                        </h3>
                        <Badge className={getStatusColor(booking.status || 'pending')}>
                          {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-300" />
                            <span>Booked: {formatDate(booking.bookingDate)}</span>
                          </div>
                          
                          {booking.checkInDate && booking.checkOutDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-300" />
                              <span>
                                {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                              </span>
                            </div>
                          )}
                          
                          {booking.travelDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-300" />
                              <span>Travel Date: {formatDate(booking.travelDate)}</span>
                            </div>
                          )}
                          
                          {booking.departureTime && booking.arrivalTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-300" />
                              <span>
                                {formatTime(booking.departureTime)} - {formatTime(booking.arrivalTime)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {booking.guestCount && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-300" />
                              <span>{booking.guestCount} guest{booking.guestCount > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          
                          {booking.roomType && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-300" />
                              <span>{booking.roomType}</span>
                            </div>
                          )}
                          
                          {booking.seatNumber && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-300" />
                              <span>Seat: {booking.seatNumber}</span>
                            </div>
                          )}
                          
                          {booking.routeName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-300" />
                              <span>{booking.routeName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-2">
                      {formatCurrency(booking.amount, booking.currency)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-green-400 text-green-200 hover:bg-green-700">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="border-green-400 text-green-200 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
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
