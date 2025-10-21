'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Eye, Users, TrendingUp, Gift, MessageCircle, Star } from 'lucide-react';
import { format } from 'date-fns';

interface StoreCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  dateOfBirth: string;
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoreCustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCustomer, setSelectedCustomer] = useState<StoreCustomer | null>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatCustomer, setChatCustomer] = useState<StoreCustomer | null>(null);

  const isValidDate = (value: any) => {
    const d = value ? new Date(value) : null;
    return d instanceof Date && !isNaN(d.getTime());
  };

  const formatSafe = (value: any, fmt: string) => {
    try {
      return isValidDate(value) ? format(new Date(value), fmt) : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store/customers');
      const data = await response.json();
      
      if (data.success) {
        const normalized = (data.customers || []).map((c: any) => ({
          ...c,
          preferences: c.preferences || { categories: [], brands: [], priceRange: { min: 0, max: 0 } },
          address: c.address || { street: '', city: '', state: '', country: '', zipCode: '' },
          createdAt: c.createdAt || c.lastOrder || null,
          dateOfBirth: c.dateOfBirth || null,
        }));
        setCustomers(normalized);
      } else {
        setError(data.error || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPromotion = (customer: StoreCustomer) => {
    setChatCustomer(customer);
    setIsPromotionModalOpen(true);
  };

  const handleMessageCustomer = (customer: StoreCustomer) => {
    setChatCustomer(customer);
    setIsChatModalOpen(true);
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 2000) return { tier: 'Gold', color: 'bg-yellow-500' };
    if (totalSpent >= 1000) return { tier: 'Silver', color: 'bg-gray-400' };
    if (totalSpent >= 500) return { tier: 'Bronze', color: 'bg-orange-600' };
    return { tier: 'New', color: 'bg-blue-500' };
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    return matchesSearch;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (isValidDate(b.createdAt) ? new Date(b.createdAt).getTime() : 0) - (isValidDate(a.createdAt) ? new Date(a.createdAt).getTime() : 0);
      case 'oldest':
        return (isValidDate(a.createdAt) ? new Date(a.createdAt).getTime() : 0) - (isValidDate(b.createdAt) ? new Date(b.createdAt).getTime() : 0);
      case 'highest-spent':
        return b.totalSpent - a.totalSpent;
      case 'most-orders':
        return b.totalOrders - a.totalOrders;
      case 'most-points':
        return b.loyaltyPoints - a.loyaltyPoints;
      default:
        return 0;
    }
  });

  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => {
    const thirtyDaysAgo = new Date(Date.now() - 2592000000);
    return isValidDate(c.createdAt) ? new Date(c.createdAt) > thirtyDaysAgo : false;
  }).length;
  const topCustomers = customers.filter(c => c.totalSpent >= 1000).length;
  const averageOrderValue = customers.length > 0 
    ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
    : 0;

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view customers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">View customers who have placed orders with your store</p>
        </div>
        <Button onClick={fetchCustomers} variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Refresh Customers
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{newCustomers}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{topCustomers}</div>
            <p className="text-xs text-muted-foreground">ZMW 1000+ spent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest-spent">Highest Spent</SelectItem>
                <SelectItem value="most-orders">Most Orders</SelectItem>
                <SelectItem value="most-points">Most Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({sortedCustomers.length})</CardTitle>
          <CardDescription>
            Customers are automatically created when they place orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-red-500">{error}</p>
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <Users className="w-8 h-8 text-gray-400" />
              <p className="text-gray-500">No customers found</p>
              <p className="text-sm text-gray-400">Customers will appear here when they make orders</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.map((customer) => {
                  const tier = getCustomerTier(customer.totalSpent);
                  return (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-sm text-gray-500">
                            Joined {formatSafe(customer.createdAt, 'MMM yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{customer.email}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tier.color} text-white`}>
                          {tier.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.totalOrders}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">ZMW {customer.totalSpent.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.loyaltyPoints}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {customer.lastOrder 
                            ? format(new Date(customer.lastOrder), 'MMM dd, yyyy')
                            : 'No orders'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Customer Details - {customer.firstName} {customer.lastName}</DialogTitle>
                                <DialogDescription>
                                  Complete customer information and order history
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCustomer && (
                                <div className="space-y-6">
                                  {/* Customer Info */}
                                  <div className="grid grid-cols-2 gap-6">
                                    <div>
                                      <h3 className="font-semibold mb-2">Personal Information</h3>
                                      <div className="space-y-1 text-sm">
                                        <div><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                                        <div><strong>Email:</strong> {selectedCustomer.email}</div>
                                        <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                                        <div><strong>Date of Birth:</strong> {formatSafe(selectedCustomer.dateOfBirth, 'MMM dd, yyyy')}</div>
                                        <div><strong>Member Since:</strong> {formatSafe(selectedCustomer.createdAt, 'MMM dd, yyyy')}</div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-semibold mb-2">Address</h3>
                                      <div className="text-sm space-y-1">
                                        <div>{selectedCustomer.address.street}</div>
                                        <div>{selectedCustomer.address.city}, {selectedCustomer.address.state}</div>
                                        <div>{selectedCustomer.address.country} {selectedCustomer.address.zipCode}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customer Stats */}
                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                      <div className="text-2xl font-bold">{selectedCustomer.totalOrders}</div>
                                      <div className="text-sm text-gray-600">Total Orders</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                      <div className="text-2xl font-bold">ZMW {selectedCustomer.totalSpent.toFixed(2)}</div>
                                      <div className="text-sm text-gray-600">Total Spent</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                      <div className="text-2xl font-bold">{selectedCustomer.loyaltyPoints}</div>
                                      <div className="text-sm text-gray-600">Loyalty Points</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                      <div className="text-2xl font-bold">{tier.tier}</div>
                                      <div className="text-sm text-gray-600">Customer Tier</div>
                                    </div>
                                  </div>

                                  {/* Preferences */}
                                  <div>
                                    <h3 className="font-semibold mb-2">Shopping Preferences</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <div className="font-medium">Categories</div>
                                        <div className="text-gray-600">
                                          {(selectedCustomer.preferences?.categories || []).join(', ')}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium">Brands</div>
                                        <div className="text-gray-600">
                                          {(selectedCustomer.preferences?.brands || []).join(', ')}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium">Price Range</div>
                                        <div className="text-gray-600">
                                          ZMW {(selectedCustomer.preferences?.priceRange?.min ?? 0)} - ZMW {(selectedCustomer.preferences?.priceRange?.max ?? 0)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendPromotion(customer)}
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMessageCustomer(customer)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Promotion Modal */}
      <Dialog open={isPromotionModalOpen} onOpenChange={setIsPromotionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Promotion</DialogTitle>
            <DialogDescription>
              Send a promotional offer to {chatCustomer?.firstName} {chatCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Promotion Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select promotion type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discount Code</SelectItem>
                  <SelectItem value="free-shipping">Free Shipping</SelectItem>
                  <SelectItem value="loyalty-bonus">Loyalty Points Bonus</SelectItem>
                  <SelectItem value="early-access">Early Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Input placeholder="Enter promotion message..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPromotionModalOpen(false)}>
                Cancel
              </Button>
              <Button>Send Promotion</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Customer</DialogTitle>
            <DialogDescription>
              Send a message to {chatCustomer?.firstName} {chatCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Enter message subject..." />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea 
                className="w-full p-3 border rounded-md h-32"
                placeholder="Enter your message..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsChatModalOpen(false)}>
                Cancel
              </Button>
              <Button>Send Message</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
