'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Search, Filter, Phone, Mail, MapPin, Clock, Calendar, Eye, MessageCircle, Star, Gift, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';
import ChatModal from '@/components/chat-modal';
import PromotionModal from '@/components/promotion-modal';

interface Customer {
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
  status: string;
  createdAt: string;
  // Additional fields for customer management
  totalStays?: number;
  averageRating?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  preferences?: string[];
  complaints?: number;
  compliments?: number;
  notes?: string;
}

export default function HotelCustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [chatCustomer, setChatCustomer] = useState<Customer | null>(null);

  // Fetch checked-out customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotel/bookings?status=checked-out');
      if (response.ok) {
        const data = await response.json();
        const customersArray = Array.isArray(data.bookings) ? data.bookings : [];
        
        // Process customers to add default values for missing fields
        const processedCustomers = customersArray.map((customer: any) => ({
          ...customer,
          totalStays: 1, // Default to 1 for now
          averageRating: 4.5, // Default rating
          loyaltyTier: 'bronze' as const, // Default tier
          preferences: ['Standard'], // Default preferences
          complaints: 0, // Default complaints
          compliments: 0, // Default compliments
        }));
        
        setCustomers(processedCustomers);
        setFilteredCustomers(processedCustomers);
      } else {
        console.error('Failed to fetch customers:', response.status);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerPhone.includes(searchTerm) ||
        customer.roomNumber.includes(searchTerm)
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(customer => customer.loyaltyTier === tierFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, tierFilter, statusFilter, customers]);

  const getTierBadge = (tier: string) => {
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

  const getStatusBadge = (status: string) => {
    const colors = {
      'checked-out': 'bg-gray-100 text-gray-800',
      'checked-in': 'bg-green-100 text-green-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleMessageCustomer = (customer: Customer) => {
    setChatCustomer(customer);
    setIsChatModalOpen(true);
  };

  const handleSendPromotion = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsPromotionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer profiles, loyalty programs, and relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPromotionModalOpen(true)}>
            <Gift className="h-4 w-4 mr-2" />
            Send Promotion
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
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
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ZMW {customers.reduce((sum, customer) => sum + customer.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {customers.length > 0 ? (customers.reduce((sum, customer) => sum + (customer.averageRating || 0), 0) / customers.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {customers.filter(c => {
                    const customerDate = new Date(c.checkOut);
                    const now = new Date();
                    return customerDate.getMonth() === now.getMonth() && customerDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{customer.customerName}</h3>
                    {getTierBadge(customer.loyaltyTier || 'bronze')}
                    {getStatusBadge(customer.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Room {customer.roomNumber} ({customer.roomType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>ZMW {customer.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Checked out: {formatDate(customer.checkOut)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{customer.adults + customer.children} guests</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{customer.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{customer.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Booking: {customer.bookingNumber}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Stay Details:</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        Check-in: {formatDate(customer.checkIn)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Check-out: {formatDate(customer.checkOut)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Payment: {customer.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMessageCustomer(customer)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" onClick={() => handleSendPromotion(customer)}>
                    <Gift className="h-4 w-4 mr-2" />
                    Offer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground">
              {searchTerm || tierFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No customers have been added yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <p className="text-sm font-medium">{selectedCustomer.customerName}</p>
                </div>
                <div>
                  <Label>Loyalty Tier</Label>
                  <p className="text-sm font-medium">{(selectedCustomer.loyaltyTier || 'bronze').toUpperCase()}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedCustomer.customerEmail}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm font-medium">{selectedCustomer.customerPhone}</p>
                </div>
                <div>
                  <Label>Room Number</Label>
                  <p className="text-sm font-medium">{selectedCustomer.roomNumber} ({selectedCustomer.roomType})</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-sm font-medium">ZMW {selectedCustomer.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Check-in Date</Label>
                  <p className="text-sm font-medium">{formatDate(selectedCustomer.checkIn)}</p>
                </div>
                <div>
                  <Label>Check-out Date</Label>
                  <p className="text-sm font-medium">{formatDate(selectedCustomer.checkOut)}</p>
                </div>
                <div>
                  <Label>Guests</Label>
                  <p className="text-sm font-medium">{selectedCustomer.adults + selectedCustomer.children} ({selectedCustomer.adults} adults, {selectedCustomer.children} children)</p>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <p className="text-sm font-medium">{selectedCustomer.paymentStatus.toUpperCase()}</p>
                </div>
                <div>
                  <Label>Booking Number</Label>
                  <p className="text-sm font-medium">{selectedCustomer.bookingNumber}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm font-medium">{selectedCustomer.status.replace('-', ' ').toUpperCase()}</p>
                </div>
              </div>
              <div>
                <Label>Stay Details</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Check-in: {formatDate(selectedCustomer.checkIn)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Check-out: {formatDate(selectedCustomer.checkOut)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Payment: {selectedCustomer.paymentStatus.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Room: {selectedCustomer.roomNumber}
                  </Badge>
                </div>
              </div>
              {selectedCustomer.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      {chatCustomer && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatCustomer(null);
          }}
          guest={{
            _id: chatCustomer._id,
            customerName: chatCustomer.customerName,
            customerEmail: chatCustomer.customerEmail,
            customerPhone: chatCustomer.customerPhone,
            roomNumber: chatCustomer.roomNumber
          }}
        />
      )}

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => {
          setIsPromotionModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </div>
  );
}

