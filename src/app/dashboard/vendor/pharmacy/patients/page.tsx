'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Search, 
  Eye,
  Phone,
  Mail,
  Calendar,
  FileText,
  Pill,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

interface Customer {
  _id: {
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orderTypes: string[];
  paymentMethods: string[];
  orderNumbers: string[];
  orderStatuses: string[];
  status: 'active' | 'inactive';
}

export default function PharmacyPatientsPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [vendorCurrency, setVendorCurrency] = useState('ZMW');

  useEffect(() => {
    fetchCustomers();
    fetchVendorCurrency();
  }, []);

  const fetchVendorCurrency = async () => {
    try {
      if (session?.user) {
        const userCurrency = (session.user as any).currency;
        if (userCurrency) {
          setVendorCurrency(userCurrency);
        }
      }
    } catch (error) {
      console.error('Error fetching vendor currency:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/customers');
      const data = await response.json();
      
      if (data.success) {
        setCustomers(data.customers || []);
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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.customerPhone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view patients</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage customers who purchased medicines from the pharmacy</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Recent purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.totalOrders, 0)}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0), vendorCurrency)}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
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
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>Manage customers who purchased medicines from the pharmacy</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer._id.customerName + customer._id.customerEmail}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        {customer.customerId && (
                          <div className="text-sm text-gray-500">ID: {customer.customerId}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.customerPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-3 h-3" />
                            <span>{customer.customerPhone}</span>
                          </div>
                        )}
                        {customer.customerEmail && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="w-3 h-3" />
                            <span>{customer.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                        <span>{customer.totalOrders} orders</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(customer.totalSpent, vendorCurrency)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(customer.lastOrderDate), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View complete customer information and purchase history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm text-gray-600">{selectedCustomer.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                </div>
                {selectedCustomer.customerId && (
                  <div>
                    <Label className="text-sm font-medium">Customer ID</Label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customerId}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Total Orders</Label>
                  <p className="text-sm text-gray-600">{selectedCustomer.totalOrders}</p>
                </div>
                {selectedCustomer.customerEmail && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customerEmail}</p>
                  </div>
                )}
                {selectedCustomer.customerPhone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-gray-600">{selectedCustomer.customerPhone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Total Spent</Label>
                  <p className="text-sm text-gray-600 font-medium">{formatCurrency(selectedCustomer.totalSpent, vendorCurrency)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">First Order</Label>
                  <p className="text-sm text-gray-600">{format(new Date(selectedCustomer.firstOrderDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Order</Label>
                  <p className="text-sm text-gray-600">{format(new Date(selectedCustomer.lastOrderDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Address */}
              {selectedCustomer.customerAddress && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCustomer.customerAddress.street}, {selectedCustomer.customerAddress.city}, {selectedCustomer.customerAddress.state} {selectedCustomer.customerAddress.zipCode}, {selectedCustomer.customerAddress.country}
                  </p>
                </div>
              )}

              {/* Order Types */}
              <div>
                <Label className="text-sm font-medium">Order Types</Label>
                <div className="mt-1">
                  {selectedCustomer.orderTypes.map((type, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {type === 'walk-in' ? 'Walk-in' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <Label className="text-sm font-medium">Payment Methods Used</Label>
                <div className="mt-1">
                  {selectedCustomer.paymentMethods.filter(method => method).map((method, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2">
                      {method === 'mobile_money' ? 'Mobile Money' : 
                       method === 'bank_transfer' ? 'Bank Transfer' :
                       method.charAt(0).toUpperCase() + method.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Order Numbers */}
              <div>
                <Label className="text-sm font-medium">Order Numbers</Label>
                <div className="mt-1">
                  {selectedCustomer.orderNumbers.map((orderNumber, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {orderNumber}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Order Statuses */}
              <div>
                <Label className="text-sm font-medium">Order Statuses</Label>
                <div className="mt-1">
                  {selectedCustomer.orderStatuses.map((status, index) => (
                    <Badge key={index} variant="default" className="mr-2 mb-2">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
