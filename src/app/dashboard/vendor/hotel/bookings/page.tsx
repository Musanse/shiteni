'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Phone, Mail, MapPin, Filter, Search, Eye, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Booking {
  _id: string;
  id?: string; // For backward compatibility
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  adults: number;
  children: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  notes?: string;
  vendorId: string;
  bookingSource?: 'online' | 'hotel'; // Track where booking was made
  createdAt: string;
  updatedAt: string;
}

interface Room {
  _id: string;
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  price: number;
  maxGuests: number;
}

export default function HotelBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    roomId: '',
    checkIn: new Date().toISOString().split('T')[0], // Default to today
    checkOut: '',
    guests: 1,
    adults: 1,
    children: 0,
    totalAmount: 0,
    paymentMethod: '',
    specialRequests: '',
    notes: ''
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [bookingSummary, setBookingSummary] = useState({
    nights: 0,
    roomPrice: 0,
    totalAmount: 0
  });

  // Fetch bookings and rooms from database
  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Only fetch bookings that need confirmation/payment (not checked-in or checked-out)
      const response = await fetch('/api/hotel/bookings?status=pending,confirmed');
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setFilteredBookings(data.bookings || []);
      } else {
        console.error('Failed to fetch bookings');
        setBookings([]);
        setFilteredBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/hotel/rooms');
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      } else {
        console.error('Failed to fetch rooms');
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  // Check room availability based on selected dates
  const checkRoomAvailability = async (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) {
      setAvailableRooms([]);
      return;
    }

    try {
      const response = await fetch(`/api/hotel/bookings?checkIn=${checkIn}&checkOut=${checkOut}`);
      if (response.ok) {
        const data = await response.json();
        const bookedRoomIds = data.bookings.map((booking: Booking) => booking.roomId);
        
        // Filter out rooms that are booked during the selected period
        const available = rooms.filter(room => 
          !bookedRoomIds.includes(room._id) && room.status !== 'maintenance' && room.status !== 'out-of-order'
        );
        
        setAvailableRooms(available);
      }
    } catch (error) {
      console.error('Error checking room availability:', error);
      setAvailableRooms([]);
    }
  };

  // Calculate booking summary when room, check-in, or check-out changes
  useEffect(() => {
    if (selectedRoom && formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nights > 0) {
        const roomPrice = selectedRoom.price;
        const totalAmount = roomPrice * nights;
        
        setBookingSummary({
          nights,
          roomPrice,
          totalAmount
        });
        
        // Update form data with calculated total
        setFormData(prev => ({
          ...prev,
          totalAmount: totalAmount
        }));
      }
    }
  }, [selectedRoom, formData.checkIn, formData.checkOut]);

  // Check room availability when dates change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      checkRoomAvailability(formData.checkIn, formData.checkOut);
    } else {
      setAvailableRooms([]);
    }
  }, [formData.checkIn, formData.checkOut, rooms]);

  // Determine if booking is a reservation based on check-in date
  const isReservation = () => {
    if (!formData.checkIn) return false;
    const checkInDate = new Date(formData.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    checkInDate.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    
    const isFutureDate = checkInDate.getTime() > today.getTime();
    
    // If check-in date is today or in the past, it's a booking
    // If check-in date is in the future, it's a reservation
    return isFutureDate;
  };

  // Check if a date is today
  const isCheckInDate = (checkInDateString: string) => {
    const checkInDate = new Date(checkInDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === today.getTime();
  };

  // Handle room selection
  const handleRoomSelection = (roomId: string) => {
    const room = availableRooms.find(r => r._id === roomId);
    setSelectedRoom(room || null);
    setFormData(prev => ({
      ...prev,
      roomId: roomId
    }));
  };

  const handleAddBooking = () => {
    setEditingBooking(null);
    setSelectedRoom(null);
    setAvailableRooms([]);
    setBookingSummary({
      nights: 0,
      roomPrice: 0,
      totalAmount: 0
    });
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      roomId: '',
      checkIn: today.toISOString().split('T')[0], // Today
      checkOut: tomorrow.toISOString().split('T')[0], // Tomorrow
      guests: 1,
      adults: 1,
      children: 0,
      totalAmount: 0,
      paymentMethod: '',
      specialRequests: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    const room = rooms.find(r => r._id === booking.roomId);
    setSelectedRoom(room || null);
    setFormData({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      roomId: booking.roomId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      adults: booking.adults,
      children: booking.children,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod || '',
      specialRequests: booking.specialRequests || '',
      notes: booking.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveBooking = async () => {
    try {
      const bookingData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        roomId: formData.roomId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        adults: formData.adults,
        children: formData.children,
        totalAmount: formData.totalAmount,
        paymentMethod: formData.paymentMethod,
        specialRequests: formData.specialRequests,
        notes: formData.notes,
        bookingSource: 'hotel', // All bookings created from hotel dashboard are hotel bookings
        status: isReservation() ? 'pending' : 'confirmed', // Reservations are pending, bookings are confirmed
        paymentStatus: (formData.paymentMethod === 'cash') ? 'paid' : 'pending' // Cash = paid, others = pending
      };

      // Debug logging removed for cleaner UI

      let response;
      if (editingBooking) {
        // Update existing booking
        response = await fetch(`/api/hotel/bookings/${editingBooking._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });
      } else {
        // Create new booking
        response = await fetch('/api/hotel/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });
      }

      if (response.ok) {
        // Refresh bookings from database
        await fetchBookings();
        
        // Reset form and close dialog
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          roomId: '',
          checkIn: '',
          checkOut: '',
          guests: 1,
          adults: 1,
          children: 0,
          totalAmount: 0,
          paymentMethod: '',
          specialRequests: '',
          notes: ''
        });
        setSelectedRoom(null);
        setAvailableRooms([]);
        setBookingSummary({
          nights: 0,
          roomPrice: 0,
          totalAmount: 0
        });
        setEditingBooking(null);
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('Failed to save booking:', error.message);
        // Error handled by console logging
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      // Error handled by console logging
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/hotel/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (response.ok) {
        // Refresh bookings from database
        await fetchBookings();
        // Success handled by UI refresh
      } else {
        const error = await response.json();
        console.error('Failed to confirm booking:', error.message);
        // Error handled by console logging
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      // Error handled by console logging
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/hotel/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });

      if (response.ok) {
        // Refresh bookings from database
        await fetchBookings();
        // Success handled by UI refresh
      } else {
        const error = await response.json();
        console.error('Failed to confirm payment:', error.message);
        // Error handled by console logging
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      // Error handled by console logging
    }
  };

  // Check-in functionality removed - handled elsewhere in the system

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.roomNumber.includes(searchTerm)
      );
    }

    // Since we only fetch pending and confirmed bookings, we only need to filter by these
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    } as const;

    const icons = {
      confirmed: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />
    };

    const labels = {
      confirmed: 'CONFIRMED',
      pending: 'BOOKING PENDING',
      cancelled: 'CANCELLED'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    const labels = {
      paid: 'PAID',
      pending: 'PAYMENT PENDING',
      failed: 'PAYMENT FAILED'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels] || status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hotel Bookings</h1>
          <p className="text-muted-foreground">Manage guest reservations and bookings</p>
        </div>
        <Button onClick={handleAddBooking}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{booking.customerName}</h3>
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.paymentStatus)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.checkIn} - {booking.checkOut}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.roomType} (Room {booking.roomNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">ZMW {booking.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{booking.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Special Requests:</strong> {booking.specialRequests}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {/* Show Confirm button for pending bookings */}
                  {booking.status === 'pending' && (
                    <Button size="sm" onClick={() => handleConfirmBooking(booking._id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                  
                  {/* Show Paid Update button for confirmed bookings with pending payment */}
                  {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                    <Button size="sm" onClick={() => handleConfirmPayment(booking._id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Paid Update
                    </Button>
                  )}
                  
                  {/* Check-in functionality removed - handled elsewhere */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No bookings have been made yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBooking 
                ? 'Edit Booking' 
                : isReservation() 
                  ? 'Add New Reservation' 
                  : 'Add New Booking'
              }
            </DialogTitle>
            <DialogDescription>
              {editingBooking 
                ? 'Update booking details' 
                : isReservation() 
                  ? 'Create a new reservation for a guest' 
                  : 'Create a new booking for a guest'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="roomId">Room *</Label>
                <Select value={formData.roomId} onValueChange={handleRoomSelection} disabled={!formData.checkIn || !formData.checkOut}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.checkIn || !formData.checkOut 
                        ? "Select check-in and check-out dates first" 
                        : availableRooms.length === 0 
                          ? "No rooms available for selected dates"
                          : "Select a room"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room._id} value={room._id}>
                        {room.number} - {room.type} (Floor {room.floor}) - ZMW {room.price}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.checkIn || !formData.checkOut ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please select check-in and check-out dates to see available rooms
                  </p>
                ) : availableRooms.length === 0 ? (
                  <p className="text-xs text-red-500 mt-1">
                    No rooms available for the selected dates
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                />
                {formData.checkIn && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isReservation() ? (
                      <span className="text-blue-600">📅 This will be a reservation (future date)</span>
                    ) : (
                      <span className="text-green-600">🏨 This will be an immediate booking (today)</span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {selectedRoom && formData.checkIn && formData.checkOut && bookingSummary.nights > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Room:</span>
                    <span className="ml-2 font-medium">{selectedRoom.number} - {selectedRoom.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="ml-2 font-medium">{selectedRoom.floor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price per night:</span>
                    <span className="ml-2 font-medium">ZMW {selectedRoom.price}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Number of nights:</span>
                    <span className="ml-2 font-medium">{bookingSummary.nights}</span>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-bold text-lg">ZMW {bookingSummary.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="guests">Total Guests *</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="adults">Adults *</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                />
              </div>
            </div>

            {/* Amount and Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  className="bg-muted"
                  readOnly={bookingSummary.totalAmount > 0}
                />
                {bookingSummary.totalAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated automatically based on room price and duration
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                placeholder="Any special requests or requirements..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBooking}>
              {editingBooking 
                ? 'Update Booking' 
                : isReservation() 
                  ? 'Create Reservation' 
                  : 'Create Booking'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
