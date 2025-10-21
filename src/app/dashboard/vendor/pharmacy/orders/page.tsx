'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package,
  CreditCard,
  User,
  MapPin,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  instructions?: string;
}

interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: CustomerAddress;
  items: OrderItem[];
  orderType: 'online' | 'walk-in';
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  notes?: string;
  orderDate: string;
  confirmedDate?: string;
  readyDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PharmacyOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showMedicineSelector, setShowMedicineSelector] = useState(false);
  const [vendorCurrency, setVendorCurrency] = useState('ZMW');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    items: [] as OrderItem[],
    orderType: 'walk-in' as 'online' | 'walk-in',
    paymentMethod: 'cash' as 'cash' | 'card' | 'mobile_money' | 'bank_transfer',
    subtotal: 0,
    tax: 0,
    shippingFee: 0,
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchMedicines();
    fetchVendorCurrency();
  }, []);

  const fetchVendorCurrency = async () => {
    try {
      // Get vendor currency from session or API
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

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/pharmacy/medicines');
      const data = await response.json();
      
      if (data.success) {
        setMedicines(data.medicines || []);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/pharmacy/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => 
          o._id === orderId 
            ? { ...o, status: status as any, ...data.order }
            : o
        ));
        setError(null);
      } else {
        setError(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const addMedicineToOrder = (medicine: any) => {
    const existingItemIndex = formData.items.findIndex(item => item.medicineId === medicine._id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setFormData({...formData, items: updatedItems});
      calculateTotals(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        medicineId: medicine._id,
        medicineName: medicine.name,
        quantity: 1,
        unitPrice: medicine.price,
        totalPrice: medicine.price,
        dosage: medicine.dosage,
        instructions: medicine.instructions
      };
      const updatedItems = [...formData.items, newItem];
      setFormData({...formData, items: updatedItems});
      calculateTotals(updatedItems);
    }
    
    setShowMedicineSelector(false);
  };

  const removeMedicineFromOrder = (medicineId: string) => {
    const updatedItems = formData.items.filter(item => item.medicineId !== medicineId);
    setFormData({...formData, items: updatedItems});
    calculateTotals(updatedItems);
  };

  const updateItemQuantity = (medicineId: string, quantity: number) => {
    const updatedItems = formData.items.map(item => {
      if (item.medicineId === medicineId) {
        return {
          ...item,
          quantity: quantity,
          totalPrice: quantity * item.unitPrice
        };
      }
      return item;
    });
    setFormData({...formData, items: updatedItems});
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const shippingFee = formData.orderType === 'online' ? 5.00 : 0;
    const totalAmount = subtotal + tax + shippingFee;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      shippingFee,
      totalAmount
    }));
  };

  const handleAddOrder = async () => {
    try {
      const response = await fetch('/api/pharmacy/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          orderDate: new Date().toISOString()
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrders([data.order, ...orders]);
        setShowAddModal(false);
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          items: [],
          orderType: 'walk-in',
          paymentMethod: 'cash',
          subtotal: 0,
          tax: 0,
          shippingFee: 0,
          totalAmount: 0,
          notes: ''
        });
        setError(null);
      } else {
        setError(data.error || 'Failed to add order');
      }
    } catch (error) {
      console.error('Error adding order:', error);
      setError('Failed to add order');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      processing: 'outline',
      ready: 'default',
      completed: 'default',
      cancelled: 'destructive'
    } as const;
    
    const isInPatients = ['confirmed', 'processing', 'ready', 'completed'].includes(status);
    
    return (
      <div className="flex items-center space-x-1">
        <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        {isInPatients && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            In Patients
          </Badge>
        )}
      </div>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      paid: 'default',
      failed: 'destructive',
      refunded: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      online: 'default',
      'walk-in': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {type === 'walk-in' ? 'Walk-in' : type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPaymentStatus;
  });

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view orders</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage medicine sales orders and online purchases</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.orderType === 'online').length}</div>
            <p className="text-xs text-muted-foreground">
              Digital purchases
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0), vendorCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by order number, customer name, or email..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Manage medicine sales orders and online purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium">{order.orderNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerEmail && (
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(order.orderType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span>{order.items.length} items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(order.totalAmount, vendorCurrency)}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(new Date(order.orderDate), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.orderDate), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'processing')}
                          >
                            Process
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                          >
                            Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}</div>
                    <div><span className="font-medium">Type:</span> {getTypeBadge(selectedOrder.orderType)}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedOrder.status)}</div>
                    <div><span className="font-medium">Payment Status:</span> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                    <div><span className="font-medium">Order Date:</span> {format(new Date(selectedOrder.orderDate), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.customerName}</div>
                    {selectedOrder.customerEmail && (
                      <div><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</div>
                    )}
                    {selectedOrder.customerAddress && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <div className="ml-2">
                          {selectedOrder.customerAddress.street}<br />
                          {selectedOrder.customerAddress.city}, {selectedOrder.customerAddress.state} {selectedOrder.customerAddress.zipCode}<br />
                          {selectedOrder.customerAddress.country}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.medicineName}</div>
                          <div className="text-sm text-gray-500">
                            Quantity: {item.quantity} × {formatCurrency(item.unitPrice, vendorCurrency)}
                          </div>
                          {item.dosage && (
                            <div className="text-sm text-gray-500">Dosage: {item.dosage}</div>
                          )}
                          {item.instructions && (
                            <div className="text-sm text-gray-500">Instructions: {item.instructions}</div>
                          )}
                        </div>
                        <div className="font-medium">{formatCurrency(item.totalPrice, vendorCurrency)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal, vendorCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedOrder.tax, vendorCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee:</span>
                    <span>{formatCurrency(selectedOrder.shippingFee, vendorCurrency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount, vendorCurrency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Order Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
            <DialogDescription>
              Create a new medicine sales order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderType">Order Type</Label>
                <Select value={formData.orderType} onValueChange={(value: 'online' | 'walk-in') => setFormData({...formData, orderType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value: 'cash' | 'card' | 'mobile_money' | 'bank_transfer') => setFormData({...formData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="Enter customer email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                placeholder="Enter customer phone"
              />
            </div>

            {/* Medicine Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Order Items</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowMedicineSelector(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
              
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No medicines added to order</p>
                  <p className="text-sm">Click "Add Medicine" to select medicines</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.medicineId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.medicineName}</h4>
                          <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice, vendorCurrency)} each</p>
                          {item.dosage && (
                            <p className="text-sm text-gray-500">Dosage: {item.dosage}</p>
                          )}
                          {item.instructions && (
                            <p className="text-sm text-gray-500">Instructions: {item.instructions}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.medicineId, Math.max(1, item.quantity - 1))}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.medicineId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.totalPrice, vendorCurrency)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMedicineFromOrder(item.medicineId)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <h3 className="font-semibold mb-2">Customer Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    value={formData.customerAddress.street}
                    onChange={(e) => setFormData({...formData, customerAddress: {...formData.customerAddress, street: e.target.value}})}
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.customerAddress.city}
                    onChange={(e) => setFormData({...formData, customerAddress: {...formData.customerAddress, city: e.target.value}})}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.customerAddress.state}
                    onChange={(e) => setFormData({...formData, customerAddress: {...formData.customerAddress, state: e.target.value}})}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.customerAddress.zipCode}
                    onChange={(e) => setFormData({...formData, customerAddress: {...formData.customerAddress, zipCode: e.target.value}})}
                    placeholder="Enter zip code"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.customerAddress.country}
                    onChange={(e) => setFormData({...formData, customerAddress: {...formData.customerAddress, country: e.target.value}})}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({...formData, subtotal: parseFloat(e.target.value) || 0})}
                  placeholder="Enter subtotal"
                />
              </div>
              <div>
                <Label htmlFor="tax">Tax</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                  placeholder="Enter tax"
                />
              </div>
              <div>
                <Label htmlFor="shippingFee">Shipping Fee</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  step="0.01"
                  value={formData.shippingFee}
                  onChange={(e) => setFormData({...formData, shippingFee: parseFloat(e.target.value) || 0})}
                  placeholder="Enter shipping fee"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                placeholder="Enter total amount"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter additional notes"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOrder}>
                Add Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medicine Selector Modal */}
      <Dialog open={showMedicineSelector} onOpenChange={setShowMedicineSelector}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Medicines</DialogTitle>
            <DialogDescription>
              Choose medicines to add to the order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {medicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No medicines available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicines.map((medicine) => (
                  <div key={medicine._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h4 className="font-medium">{medicine.name}</h4>
                      <p className="text-sm text-gray-500">{medicine.genericName}</p>
                      <p className="text-sm text-gray-500">Category: {medicine.category}</p>
                      <p className="text-sm text-gray-500">Form: {medicine.form}</p>
                      <p className="text-sm text-gray-500">Stock: {medicine.stock}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-600">{formatCurrency(medicine.price, vendorCurrency)}</span>
                        <Button
                          size="sm"
                          onClick={() => addMedicineToOrder(medicine)}
                          disabled={medicine.stock <= 0}
                        >
                          Add to Order
                        </Button>
                      </div>
                      {medicine.stock <= 0 && (
                        <p className="text-xs text-red-500">Out of stock</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
