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
import { Search, Filter, Eye, Package, TrendingUp, Clock, CheckCircle, XCircle, Truck, DollarSign, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StoreOrder {
  _id: string;
  customerId: string;
  orderNumber: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoreOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureFormData, setCaptureFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    items: [{ productId: '', name: '', quantity: 1, price: 0 }],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    paymentMethod: 'online',
    shippingAddress: {
      name: '',
      street: '',
      city: '',
      state: '',
      country: 'Zambia',
      zipCode: '',
      phone: ''
    },
    notes: ''
  });
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const showNotificationModal = (type: 'success' | 'error', title: string, message: string) => {
    setNotificationData({ type, title, message });
    setShowNotification(true);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/store/products?status=active');
      const data = await response.json();
      
      if (data.success) {
        setAvailableProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', data.error);
        // Fallback: try without status filter
        try {
          const fallbackResponse = await fetch('/api/store/products');
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success) {
            setAvailableProducts(fallbackData.products || []);
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store/orders');
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

  const handleStatusUpdate = async (orderId: string, newStatus: StoreOrder['status']) => {
    try {
      const res = await fetch(`/api/store/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      // If delivered, remove from active list immediately; otherwise update in place
      if (newStatus === 'delivered') {
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
      showNotificationModal('success', 'Status Updated', `Order status updated to ${newStatus}.`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showNotificationModal('error', 'Update Failed', error.message || 'Could not update status.');
    }
  };

  const handlePaymentUpdate = async (orderId: string, newPaymentStatus: StoreOrder['paymentStatus']) => {
    try {
      const res = await fetch(`/api/store/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
      showNotificationModal('success', 'Payment Updated', `Payment marked ${newPaymentStatus}.`);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      showNotificationModal('error', 'Update Failed', error.message || 'Could not update payment.');
    }
  };

  const handleCaptureOrders = async () => {
    try {
      setCapturing(true);
      
      // Calculate totals
      const subtotal = captureFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.16; // 16% VAT
      const shipping = captureFormData.shipping || 0;
      const discount = captureFormData.discount || 0;
      const total = subtotal + tax + shipping - discount;

      const response = await fetch('/api/store/orders/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: `customer-${Date.now()}`,
          items: captureFormData.items.map(item => ({
            productId: `prod-${Date.now()}-${Math.random()}`,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })),
          subtotal,
          tax,
          shipping,
          discount,
          total,
          paymentMethod: captureFormData.paymentMethod,
          shippingAddress: {
            name: captureFormData.customerName,
            street: captureFormData.shippingAddress.street,
            city: captureFormData.shippingAddress.city,
            state: captureFormData.shippingAddress.state,
            country: captureFormData.shippingAddress.country,
            zipCode: captureFormData.shippingAddress.zipCode,
            phone: captureFormData.customerPhone
          },
          billingAddress: {
            name: captureFormData.customerName,
            street: captureFormData.shippingAddress.street,
            city: captureFormData.shippingAddress.city,
            state: captureFormData.shippingAddress.state,
            country: captureFormData.shippingAddress.country,
            zipCode: captureFormData.shippingAddress.zipCode,
            phone: captureFormData.customerPhone
          },
          notes: captureFormData.notes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh orders list
        await fetchOrders();
        setShowCaptureForm(false);
        // Reset form
        setCaptureFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          items: [{ productId: '', name: '', quantity: 1, price: 0 }],
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
          total: 0,
          paymentMethod: 'online',
          shippingAddress: {
            name: '',
            street: '',
            city: '',
            state: '',
            country: 'Zambia',
            zipCode: '',
            phone: ''
          },
          notes: ''
        });
        showNotificationModal('success', 'Order Captured Successfully!', 'The online order has been added to your order management system.');
      } else {
        setError(data.error || 'Failed to capture orders');
        showNotificationModal('error', 'Failed to Capture Order', data.error || 'There was an error capturing the order. Please try again.');
      }
    } catch (error) {
      console.error('Error capturing orders:', error);
      setError('Failed to capture orders');
      showNotificationModal('error', 'Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleFormInputChange = (field: string, value: any) => {
    setCaptureFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...captureFormData.items];
    
    if (field === 'productId') {
      // Don't process special values
      if (value === 'loading' || value === 'no-products') {
        return;
      }
      
      // Handle add-products option
      if (value === 'add-products') {
        window.open('/dashboard/vendor/store/inventory', '_blank');
        return;
      }
      
      // Find the selected product
      const selectedProduct = availableProducts.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index] = { 
          ...newItems[index], 
          productId: selectedProduct._id,
          name: selectedProduct.name,
          price: selectedProduct.price
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setCaptureFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setCaptureFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (captureFormData.items.length > 1) {
      const newItems = captureFormData.items.filter((_, i) => i !== index);
      setCaptureFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      confirmed: { variant: 'default' as const, label: 'Confirmed', icon: CheckCircle },
      processing: { variant: 'default' as const, label: 'Processing', icon: Package },
      shipped: { variant: 'default' as const, label: 'Shipped', icon: Truck },
      delivered: { variant: 'default' as const, label: 'Delivered', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      paid: { variant: 'default' as const, label: 'Paid' },
      refunded: { variant: 'destructive' as const, label: 'Refunded' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shippingAddress.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    // Hide delivered orders by default (unless explicitly selected)
    const matchesStatus =
      statusFilter === 'all'
        ? order.status !== 'delivered'
        : statusFilter === 'delivered'
          ? order.status === 'delivered'
          : order.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <Button onClick={() => setShowCaptureForm(true)}>
          <Download className="w-4 h-4 mr-2" />
          Capture Orders
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveredOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {totalRevenue.toFixed(2)}</div>
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
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Manage customer orders and track fulfillment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.shippingAddress.name}</div>
                        <div className="text-sm text-gray-500">{order.shippingAddress.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.name} x{item.quantity}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">ZMW {order.total.toFixed(2)}</div>
                      {order.discount > 0 && (
                        <div className="text-sm text-green-600">
                          -ZMW {order.discount.toFixed(2)} discount
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* View */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                              <DialogDescription>
                                Complete order information and customer details
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Order Summary */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-2">Order Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Order Number:</strong> {selectedOrder.orderNumber}</div>
                                      <div><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</div>
                                      <div><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                                      <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</div>
                                      <div><strong>Created:</strong> {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-2">Order Totals</h3>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>ZMW {selectedOrder.subtotal.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>ZMW {selectedOrder.tax.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Shipping:</span>
                                        <span>ZMW {selectedOrder.shipping.toFixed(2)}</span>
                                      </div>
                                      {selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Discount:</span>
                                          <span>-ZMW {selectedOrder.discount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Total:</span>
                                        <span>ZMW {selectedOrder.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h3 className="font-semibold mb-2">Order Items</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedOrder.items.map((item, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{item.name}</TableCell>
                                          <TableCell>{item.quantity}</TableCell>
                                          <TableCell>ZMW {item.price.toFixed(2)}</TableCell>
                                          <TableCell>ZMW {item.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                {/* Addresses */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                                    <div className="text-sm space-y-1">
                                      <div>{selectedOrder.shippingAddress.name}</div>
                                      <div>{selectedOrder.shippingAddress.street}</div>
                                      <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</div>
                                      <div>{selectedOrder.shippingAddress.country} {selectedOrder.shippingAddress.zipCode}</div>
                                      <div>{selectedOrder.shippingAddress.phone}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-2">Billing Address</h3>
                                    <div className="text-sm space-y-1">
                                      <div>{selectedOrder.billingAddress.name}</div>
                                      <div>{selectedOrder.billingAddress.street}</div>
                                      <div>{selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state}</div>
                                      <div>{selectedOrder.billingAddress.country} {selectedOrder.billingAddress.zipCode}</div>
                                      <div>{selectedOrder.billingAddress.phone}</div>
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

                                {/* Status & Payment Update */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Update Status</h3>
                                    <div className="flex space-x-2">
                                      <Select value={selectedOrder.status} onValueChange={(value) => handleStatusUpdate(selectedOrder._id, value as StoreOrder['status'])}>
                                        <SelectTrigger className="w-[200px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="confirmed">Confirmed</SelectItem>
                                          <SelectItem value="processing">Processing</SelectItem>
                                          <SelectItem value="shipped">Shipped</SelectItem>
                                          <SelectItem value="delivered">Delivered</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Payment</h3>
                                    <div className="flex space-x-2">
                                      <Select value={selectedOrder.paymentStatus} onValueChange={(value) => handlePaymentUpdate(selectedOrder._id, value as StoreOrder['paymentStatus'])}>
                                        <SelectTrigger className="w-[200px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="paid">Mark as Paid</SelectItem>
                                          <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Inline status-based quick actions */}
                        {order.status === 'pending' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'confirmed')}>Confirm</Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'processing')}>Process</Button>
                        )}
                        {order.status === 'processing' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'shipped')}>Ship</Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'delivered')}>Deliver</Button>
                        )}
                        {order.paymentStatus === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handlePaymentUpdate(order._id, 'paid')}>Mark Paid</Button>
                        )}
                        {order.paymentStatus === 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => handlePaymentUpdate(order._id, 'refunded')}>Refund</Button>
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

      {/* Capture Orders Dialog */}
      <Dialog open={showCaptureForm} onOpenChange={(open) => {
        setShowCaptureForm(open);
        if (open) {
          fetchAvailableProducts();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capture Online Order</DialogTitle>
            <DialogDescription>
              Manually capture an online order and add it to your order management system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={captureFormData.customerName}
                  onChange={(e) => handleFormInputChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={captureFormData.customerPhone}
                  onChange={(e) => handleFormInputChange('customerPhone', e.target.value)}
                  placeholder="+260123456789"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                value={captureFormData.customerEmail}
                onChange={(e) => handleFormInputChange('customerEmail', e.target.value)}
                placeholder="customer@example.com"
                type="email"
              />
            </div>

            {/* Order Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Order Items *</Label>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={fetchAvailableProducts}>
                    <Package className="w-4 h-4 mr-2" />
                    Refresh Products
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {captureFormData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>Product *</Label>
                      <Select 
                        value={item.productId} 
                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingProducts ? (
                            <SelectItem value="loading" disabled>Loading products...</SelectItem>
                          ) : availableProducts.length === 0 ? (
                            <>
                              <SelectItem value="no-products" disabled>No products available</SelectItem>
                              <SelectItem value="add-products" onClick={() => window.open('/dashboard/vendor/store/inventory', '_blank')}>
                                + Add products to inventory
                              </SelectItem>
                            </>
                          ) : (
                            availableProducts.map((product) => (
                              <SelectItem key={product._id} value={product._id}>
                                {product.name} - ZMW {product.price.toFixed(2)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Price (ZMW)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        disabled={!!item.productId} // Disable if product is selected
                        className={item.productId ? 'bg-[#6F4E37] text-white' : 'bg-[#6F4E37] text-white'}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <div className="text-sm font-medium pt-2">
                        Total: ZMW {(item.price * item.quantity).toFixed(2)}
                      </div>
                      {captureFormData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping">Shipping Cost (ZMW)</Label>
                <Input
                  id="shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  value={captureFormData.shipping}
                  onChange={(e) => handleFormInputChange('shipping', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount (ZMW)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={captureFormData.discount}
                  onChange={(e) => handleFormInputChange('discount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={captureFormData.paymentMethod} onValueChange={(value) => handleFormInputChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Address */}
            <div>
              <Label className="text-base font-semibold">Shipping Address</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={captureFormData.shippingAddress.street}
                    onChange={(e) => handleFormInputChange('shippingAddress', {
                      ...captureFormData.shippingAddress,
                      street: e.target.value
                    })}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={captureFormData.shippingAddress.city}
                    onChange={(e) => handleFormInputChange('shippingAddress', {
                      ...captureFormData.shippingAddress,
                      city: e.target.value
                    })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={captureFormData.shippingAddress.state}
                    onChange={(e) => handleFormInputChange('shippingAddress', {
                      ...captureFormData.shippingAddress,
                      state: e.target.value
                    })}
                    placeholder="State/Province"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={captureFormData.shippingAddress.zipCode}
                    onChange={(e) => handleFormInputChange('shippingAddress', {
                      ...captureFormData.shippingAddress,
                      zipCode: e.target.value
                    })}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Order Notes</Label>
              <Textarea
                id="notes"
                value={captureFormData.notes}
                onChange={(e) => handleFormInputChange('notes', e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-[#6F4E37] text-white p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-white">Order Summary</h3>
              <div className="space-y-1 text-sm text-white">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>ZMW {captureFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (16%):</span>
                  <span>ZMW {(captureFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.16).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>ZMW {captureFormData.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-ZMW {captureFormData.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-white/20 pt-1">
                  <span>Total:</span>
                  <span>ZMW {(captureFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (captureFormData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.16) + captureFormData.shipping - captureFormData.discount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCaptureForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCaptureOrders} disabled={capturing || !captureFormData.customerName || !captureFormData.customerPhone || captureFormData.items.some(item => !item.productId || item.price <= 0)}>
                {capturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Capturing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Capture Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Custom Notification Modal */}
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              notificationData?.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {notificationData?.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {notificationData?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {notificationData?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowNotification(false)}
              className={`${
                notificationData?.type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
