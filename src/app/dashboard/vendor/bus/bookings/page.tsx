'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  DollarSign,
  Check,
  X
} from 'lucide-react';

interface Booking {
  _id: string;
  bookingNumber: string;
  type: 'online' | 'walk_in';
  customerDetails: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
    idNumber?: string;
    idType?: string;
  };
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  seatNumbers: string[];
  boardingPoint: string;
  droppingPoint: string;
  fareAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  departureDate: string;
  departureTime: string;
  status: string;
  soldByName?: string;
  createdAt: string;
  updatedAt: string;
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
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'completed':
      return <UserCheck className="h-5 w-5 text-blue-500" />;
    case 'no_show':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'no_show':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'card':
      return <CreditCard className="h-4 w-4" />;
    case 'mobile_money':
      return <Smartphone className="h-4 w-4" />;
    case 'cash':
      return <Banknote className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

export default function BusBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, typeFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('bookingType', typeFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/bus/bookings?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.bookingNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customerDetails?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customerDetails?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customerDetails?.phoneNumber || '').includes(searchTerm) ||
      (booking.routeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.busName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.passengerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.passengerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.passengerPhone || '').includes(searchTerm) ||
      (booking.boardingStop?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.alightingStop?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleDownloadBooking = (booking: Booking) => {
    const bookingText = `BUS BOOKING RECEIPT
====================

Booking Number: ${booking.bookingNumber}
Type: ${booking.type === 'online' ? 'Online Booking' : 'Walk-in Ticket'}
Status: ${booking.status.toUpperCase()}

TRIP INFORMATION
================
Route: ${booking.routeName}
Boarding Point: ${booking.boardingPoint}
Dropping Point: ${booking.droppingPoint}
Bus: ${booking.busPlateNumber || booking.busName}
Seat(s): ${booking.seatNumbers.join(', ')}
Departure Date: ${formatDate(booking.departureDate)}
Departure Time: ${formatTime(booking.departureTime)}

CUSTOMER INFORMATION
====================
Name: ${booking.passengerName || `${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim() || 'N/A'}
Phone: ${booking.passengerPhone || booking.customerDetails?.phoneNumber || 'N/A'}
${booking.passengerEmail || booking.customerDetails?.email ? `Email: ${booking.passengerEmail || booking.customerDetails?.email}` : ''}
${booking.customerDetails?.idNumber ? `ID Number: ${booking.customerDetails.idNumber} (${booking.customerDetails.idType})` : ''}

PAYMENT INFORMATION
===================
Fare Amount: ${formatCurrency(booking.fare || booking.fareAmount || 0, booking.currency || 'ZMW')}
Payment Method: ${booking.paymentMethod}
Payment Status: ${booking.paymentStatus}
${booking.paymentReference ? `Payment Reference: ${booking.paymentReference}` : ''}
${booking.soldByName ? `Sold by: ${booking.soldByName}` : ''}

Generated on: ${new Date().toLocaleString()}`;

    const blob = new Blob([bookingText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bus-booking-${booking.bookingNumber}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpdateBookingStatus = async (bookingId: string, updateType: 'payment' | 'confirmation', newStatus: string) => {
    try {
      setUpdatingBooking(bookingId);
      setUpdateError(null);

      const response = await fetch(`/api/bus/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          updateType,
          newStatus
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the booking in the local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId 
              ? { 
                  ...booking, 
                  ...(updateType === 'payment' ? { paymentStatus: newStatus } : { status: newStatus })
                }
              : booking
          )
        );

        // Update selected booking if it's the same one
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking(prev => prev ? {
            ...prev,
            ...(updateType === 'payment' ? { paymentStatus: newStatus } : { status: newStatus })
          } : null);
        }

        console.log(`${updateType === 'payment' ? 'Payment' : 'Booking'} status updated successfully`);
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setUpdateError('Failed to update booking status');
    } finally {
      setUpdatingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
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
          <Button onClick={fetchBookings} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Bus Bookings</h1>
          <p className="text-gray-600 mt-1">View all online bookings and walk-in tickets</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {bookings.length} Total
          </Badge>
        </div>
      </div>

      {/* Update Error Display */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{updateError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUpdateError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bookings..."
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online Bookings</SelectItem>
                <SelectItem value="walk_in">Walk-in Tickets</SelectItem>
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

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'No bookings have been made yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(booking.status)}
                      <div>
                        <h3 className="text-lg font-semibold">{booking.bookingNumber}</h3>
                        <p className="text-sm text-gray-500">
                          {booking.busPlateNumber || booking.busName} - {booking.tripName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{booking.passengerName || `${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim() || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{booking.passengerPhone || booking.customerDetails?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.boardingStop || booking.boardingPoint} → {booking.alightingStop || booking.droppingPoint}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(booking.fare || booking.fareAmount || 0, booking.currency || 'ZMW')}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge variant="outline">
                          {booking.type === 'online' ? 'Online' : 'Walk-in'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBooking(booking)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBooking(booking)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      
                      {/* Payment Status Update Button */}
                      {booking.paymentStatus === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(booking._id, 'payment', 'paid')}
                          disabled={updatingBooking === booking._id}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {updatingBooking === booking._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-1" />
                          )}
                          Mark Paid
                        </Button>
                      )}
                      
                      {/* Booking Confirmation Button */}
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(booking._id, 'confirmation', 'confirmed')}
                          disabled={updatingBooking === booking._id}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          {updatingBooking === booking._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Booking Number</Label>
                  <p className="text-sm">{selectedBooking.bookingNumber}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Type</Label>
                  <p className="text-sm">
                    {selectedBooking.type === 'online' ? 'Online Booking' : 'Walk-in Ticket'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Status</Label>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium text-sm">Payment Status</Label>
                  <Badge variant="outline">{selectedBooking.paymentStatus}</Badge>
                </div>
              </div>

              <div>
                <Label className="font-medium text-sm">Trip Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedBooking.routeName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedBooking.boardingStop || selectedBooking.boardingPoint} → {selectedBooking.alightingStop || selectedBooking.droppingPoint}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(selectedBooking.departureDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatTime(selectedBooking.departureTime)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium text-sm">Customer Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{selectedBooking.passengerName || `${selectedBooking.customerDetails?.firstName || ''} ${selectedBooking.customerDetails?.lastName || ''}`.trim() || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{selectedBooking.passengerPhone || selectedBooking.customerDetails?.phoneNumber || 'N/A'}</span>
                  </div>
                  {(selectedBooking.passengerEmail || selectedBooking.customerDetails?.email) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedBooking.passengerEmail || selectedBooking.customerDetails?.email}</span>
                    </div>
                  )}
                  {selectedBooking.customerDetails?.idNumber && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedBooking.customerDetails.idNumber} ({selectedBooking.customerDetails.idType})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="font-medium text-sm">Payment Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    {getPaymentMethodIcon(selectedBooking.paymentMethod)}
                    <span>{selectedBooking.paymentMethod}</span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedBooking.fare || selectedBooking.fareAmount || 0, selectedBooking.currency || 'ZMW')}
                  </div>
                  {selectedBooking.paymentReference && (
                    <div className="text-sm text-gray-500">
                      Reference: {selectedBooking.paymentReference}
                    </div>
                  )}
                  {selectedBooking.soldByName && (
                    <div className="text-sm text-gray-500">
                      Sold by: {selectedBooking.soldByName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="flex space-x-2">
                  {/* Payment Status Update Button */}
                  {selectedBooking.paymentStatus === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'payment', 'paid')}
                      disabled={updatingBooking === selectedBooking._id}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      {updatingBooking === selectedBooking._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-1" />
                      )}
                      Mark Paid
                    </Button>
                  )}
                  
                  {/* Booking Confirmation Button */}
                  {selectedBooking.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'confirmation', 'confirmed')}
                      disabled={updatingBooking === selectedBooking._id}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      {updatingBooking === selectedBooking._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Confirm Booking
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadBooking(selectedBooking)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}