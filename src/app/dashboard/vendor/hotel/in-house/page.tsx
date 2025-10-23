'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Search, Filter, Phone, Mail, MapPin, Clock, Calendar, Eye, MessageCircle, Bell, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import ChatModal from '@/components/chat-modal';

interface InHouseGuest {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: 'checked-in' | 'extended' | 'early-checkout' | 'special-needs';
  specialRequests?: string;
  lastActivity: string;
  totalAmount: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  notes?: string;
}

interface PendingCheckIn {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  paymentStatus: string;
  bookingNumber: string;
}

export default function InHouseGuestsPage() {
  const { data: session } = useSession();
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<InHouseGuest[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<PendingCheckIn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<InHouseGuest | null>(null);
  const [chatGuest, setChatGuest] = useState<InHouseGuest | null>(null);

  // Fetch in-house guests (checked-in bookings)
  const fetchInHouseGuests = async () => {
    try {
      const response = await fetch('/api/hotel/bookings?status=checked-in');
      if (response.ok) {
        const data = await response.json();
        console.log('All checked-in bookings API response:', data);
        // The API returns { bookings: [...] }, so extract the bookings array
        const bookings = data.bookings || data;
        console.log('Extracted checked-in bookings:', bookings);
        // Ensure data is an array
        const guestsArray = Array.isArray(bookings) ? bookings : [];
        setGuests(guestsArray);
        setFilteredGuests(guestsArray);
      } else {
        console.error('Failed to fetch in-house guests:', response.status);
        setGuests([]);
        setFilteredGuests([]);
      }
    } catch (error) {
      console.error('Error fetching in-house guests:', error);
      setGuests([]);
      setFilteredGuests([]);
    }
  };

  // Debug function to fetch all bookings
  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/hotel/bookings');
      if (response.ok) {
        const data = await response.json();
        console.log('ALL BOOKINGS API RESPONSE:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        
        // The API returns { bookings: [...] }, so extract the bookings array
        const bookings = data.bookings || data;
        console.log('Extracted bookings:', bookings);
        console.log('Bookings type:', typeof bookings, 'Is array:', Array.isArray(bookings));
        
        if (Array.isArray(bookings)) {
          console.log('Booking statuses:', bookings.map((b: any) => ({ 
            id: b._id, 
            customer: b.customerName, 
            status: b.status, 
            paymentStatus: b.paymentStatus, 
            checkIn: b.checkIn,
            checkOut: b.checkOut 
          })));
        } else {
          console.log('Bookings is not an array:', bookings);
        }
      } else {
        console.error('Failed to fetch all bookings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };

  // Fetch pending check-ins (confirmed bookings for today)
  const fetchPendingCheckIns = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching pending check-ins for date:', today);
      const response = await fetch(`/api/hotel/bookings?status=confirmed&paymentStatus=paid`);
      if (response.ok) {
        const data = await response.json();
        console.log('API response for pending check-ins:', data);
        // The API returns { bookings: [...] }, so extract the bookings array
        const bookings = data.bookings || data;
        console.log('Extracted pending check-ins:', bookings);
        // Ensure data is an array
        const pendingArray = Array.isArray(bookings) ? bookings : [];
        console.log('Processed pending check-ins array:', pendingArray);
        setPendingCheckIns(pendingArray);
      } else {
        console.error('Failed to fetch pending check-ins:', response.status, response.statusText);
        setPendingCheckIns([]);
      }
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      setPendingCheckIns([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchInHouseGuests(), fetchPendingCheckIns(), fetchAllBookings()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Ensure guests is an array before filtering
    if (!Array.isArray(guests)) {
      setFilteredGuests([]);
      return;
    }

    let filtered = guests;

    if (searchTerm) {
      filtered = filtered.filter(guest =>
        guest.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.roomNumber?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(guest => guest.loyaltyTier === tierFilter);
    }

    setFilteredGuests(filtered);
  }, [searchTerm, statusFilter, tierFilter, guests]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'checked-in': 'default',
      'extended': 'secondary',
      'early-checkout': 'destructive',
      'special-needs': 'outline'
    } as const;

    const colors = {
      'checked-in': 'bg-green-100 text-green-800',
      'extended': 'bg-blue-100 text-blue-800',
      'early-checkout': 'bg-red-100 text-red-800',
      'special-needs': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;

    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={colors[tier as keyof typeof colors]}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const handleViewGuest = (guest: InHouseGuest) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  const handleMessageGuest = (guest: InHouseGuest) => {
    setChatGuest(guest);
    setIsChatModalOpen(true);
  };

  const handleCheckInGuest = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/hotel/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'checked-in' }),
      });

      if (response.ok) {
        // Update room status to occupied
        const booking = Array.isArray(pendingCheckIns) ? pendingCheckIns.find(b => b._id === bookingId) : null;
        if (booking) {
          await fetch(`/api/hotel/rooms/${booking.roomNumber}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'occupied' }),
          });
        }
        
        // Refresh data
        await Promise.all([fetchInHouseGuests(), fetchPendingCheckIns()]);
        setIsCheckInDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('Failed to check in guest:', error.message);
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
    }
  };

  const handleCheckOutGuest = async (guestId: string) => {
    try {
      const response = await fetch(`/api/hotel/bookings/${guestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'checked-out' }),
      });

      if (response.ok) {
        // Update room status to available
        const guest = Array.isArray(guests) ? guests.find(g => g._id === guestId) : null;
        if (guest) {
          await fetch(`/api/hotel/rooms/${guest.roomNumber}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'available' }),
          });
        }
        
        // Refresh data
        await fetchInHouseGuests();
        console.log('Guest checked out successfully');
      } else {
        const error = await response.json();
        console.error('Failed to check out guest:', error.message);
      }
    } catch (error) {
      console.error('Error checking out guest:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">In-House Guests</h1>
          <p className="text-muted-foreground">Manage current guests and their stay details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
          <Button onClick={() => setIsCheckInDialogOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            Check In Guest
          </Button>
        </div>
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
                  placeholder="Search guests..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="extended">Extended Stay</SelectItem>
                <SelectItem value="early-checkout">Early Checkout</SelectItem>
                <SelectItem value="special-needs">Special Needs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In-House Guests</p>
                <p className="text-2xl font-bold">{Array.isArray(guests) ? guests.length : 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Check-ins</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray(pendingCheckIns) ? pendingCheckIns.length : 0}
                </p>
              </div>
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Array.isArray(guests) ? guests.length : 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ZMW {Array.isArray(guests) ? guests.reduce((sum, guest) => sum + (guest.totalAmount || 0), 0) : 0}
                </p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guests List */}
      <div className="space-y-4">
        {Array.isArray(filteredGuests) && filteredGuests.map((guest) => (
          <Card key={guest._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{guest.customerName}</h3>
                    {getStatusBadge(guest.status)}
                    {getTierBadge(guest.loyaltyTier)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Room {guest.roomNumber} ({guest.roomType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{guest.checkIn} - {guest.checkOut}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{guest.adults + guest.children} guest{(guest.adults + guest.children) > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">ZMW {guest.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{guest.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{guest.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Last activity: {guest.lastActivity}</span>
                    </div>
                  </div>

                  {guest.specialRequests && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Special Requests:</strong> {guest.specialRequests}
                      </p>
                    </div>
                  )}

                  {guest.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">
                        <strong>Notes:</strong> {guest.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewGuest(guest)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMessageGuest(guest)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" onClick={() => handleCheckOutGuest(guest._id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Array.isArray(filteredGuests) && filteredGuests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No guests found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No guests are currently checked in.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Guest Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedGuest?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <p className="text-sm font-medium">{selectedGuest.customerName}</p>
                </div>
                <div>
                  <Label>Room Number</Label>
                  <p className="text-sm font-medium">{selectedGuest.roomNumber}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedGuest.customerEmail}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm font-medium">{selectedGuest.customerPhone}</p>
                </div>
                <div>
                  <Label>Check In</Label>
                  <p className="text-sm font-medium">{selectedGuest.checkIn}</p>
                </div>
                <div>
                  <Label>Check Out</Label>
                  <p className="text-sm font-medium">{selectedGuest.checkOut}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-sm font-medium">ZMW {selectedGuest.totalAmount}</p>
                </div>
                <div>
                  <Label>Loyalty Tier</Label>
                  <p className="text-sm font-medium">{selectedGuest.loyaltyTier?.toUpperCase()}</p>
                </div>
              </div>
              {selectedGuest.specialRequests && (
                <div>
                  <Label>Special Requests</Label>
                  <p className="text-sm">{selectedGuest.specialRequests}</p>
                </div>
              )}
              {selectedGuest.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedGuest.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-in Modal */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check In Guests</DialogTitle>
            <DialogDescription>
              Select a guest to check in. Only confirmed bookings for today are shown.
            </DialogDescription>
          </DialogHeader>
          
          {!Array.isArray(pendingCheckIns) || pendingCheckIns.length === 0 ? (
            <div className="text-center py-8">
              <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No pending check-ins</h3>
              <p className="text-muted-foreground">
                There are no confirmed bookings for today waiting to be checked in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(pendingCheckIns) && pendingCheckIns.map((booking) => (
                <Card key={booking._id} className="hover:shadow-md transition-shadow cursor-pointer" 
                      onClick={() => handleCheckInGuest(booking._id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{booking.customerName}</h3>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {booking.bookingNumber}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Room {booking.roomNumber} ({booking.roomType})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{booking.checkIn} - {booking.checkOut}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{booking.adults + booking.children} guest{(booking.adults + booking.children) > 1 ? 's' : ''}</span>
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
                          <div className="flex items-center gap-2">
                            <Badge className={booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {booking.paymentStatus.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <LogIn className="h-4 w-4 mr-2" />
                          Check In
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      {chatGuest && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatGuest(null);
          }}
          guest={chatGuest}
        />
      )}
    </div>
  );
}
