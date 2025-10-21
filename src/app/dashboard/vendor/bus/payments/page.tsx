'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Banknote,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ticket,
  Package,
  Bus
} from 'lucide-react';

interface BusPayment {
  _id: string;
  paymentId: string;
  source: 'booking' | 'ticket' | 'dispatch';
  bookingId?: string;
  ticketId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId?: string;
  reference?: string;
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  busNumber?: string;
  seatNumber?: string;
  boardingPoint?: string;
  droppingPoint?: string;
  departureDate: string;
  departureTime?: string;
  paymentDate: string;
  processedBy?: string;
  processedByName?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  busCompanyId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalAmount: number;
  totalPayments: number;
  completedAmount: number;
  completedCount: number;
  pendingAmount: number;
  pendingCount: number;
  failedAmount: number;
  failedCount: number;
}

export default function BusPaymentsPage() {
  const [payments, setPayments] = useState<BusPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalPayments: 0,
    completedAmount: 0,
    completedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    failedAmount: 0,
    failedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<BusPayment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentMethodFilter && paymentMethodFilter !== 'all') params.append('paymentMethod', paymentMethodFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/bus/payments?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      } else {
        setError(data.error || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchTerm, statusFilter, paymentMethodFilter, startDate, endDate]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayments();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_money': return <Smartphone className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'bank_transfer': return <DollarSign className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'booking': return <Bus className="h-4 w-4" />;
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'dispatch': return <Package className="h-4 w-4" />;
      default: return <Bus className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'booking': return 'bg-blue-100 text-blue-800';
      case 'ticket': return 'bg-green-100 text-green-800';
      case 'dispatch': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'booking': return 'Online Booking';
      case 'ticket': return 'Walk-in Ticket';
      case 'dispatch': return 'Parcel Dispatch';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewPayment = (payment: BusPayment) => {
    setSelectedPayment(payment);
    setViewModalOpen(true);
  };

  const handleExportPayments = () => {
    const csvContent = [
      ['Payment ID', 'Customer', 'Amount', 'Method', 'Status', 'Trip', 'Route', 'Date'].join(','),
      ...payments.map(payment => [
        payment.paymentId,
        payment.customerName,
        payment.amount,
        payment.paymentMethod,
        payment.paymentStatus,
        payment.tripName,
        payment.routeName,
        formatDate(payment.paymentDate)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bus-payments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bus Payments</h1>
          <p className="text-gray-600">Manage and track bus payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPayments} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchPayments} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPayments} total payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.completedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCount} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.failedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedCount} payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">No payments match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{payment.paymentId}</h3>
                        <Badge className={getStatusColor(payment.paymentStatus)}>
                          {getStatusIcon(payment.paymentStatus)}
                          <span className="ml-1 capitalize">{payment.paymentStatus}</span>
                        </Badge>
                        <Badge className={getSourceColor(payment.source)}>
                          {getSourceIcon(payment.source)}
                          <span className="ml-1">{getSourceLabel(payment.source)}</span>
                        </Badge>
                        <Badge variant="outline">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="ml-1 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer</p>
                          <p className="font-medium">{payment.customerName}</p>
                          {payment.customerPhone && (
                            <p className="text-gray-500">{payment.customerPhone}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Trip</p>
                          <p className="font-medium">{payment.tripName}</p>
                          <p className="text-gray-500">{payment.routeName}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium text-lg">{formatCurrency(payment.amount)}</p>
                          {payment.seatNumber && (
                            <p className="text-gray-500">Seat: {payment.seatNumber}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                          {payment.departureDate && (
                            <p className="text-gray-500">
                              Departs: {new Date(payment.departureDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Payment Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete payment information for {selectedPayment?.paymentId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment ID</Label>
                  <p className="font-medium">{selectedPayment.paymentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className={getStatusColor(selectedPayment.paymentStatus)}>
                    {getStatusIcon(selectedPayment.paymentStatus)}
                    <span className="ml-1 capitalize">{selectedPayment.paymentStatus}</span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Source</Label>
                  <Badge className={getSourceColor(selectedPayment.source)}>
                    {getSourceIcon(selectedPayment.source)}
                    <span className="ml-1">{getSourceLabel(selectedPayment.source)}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="font-medium text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="font-medium">{selectedPayment.customerName}</p>
                  {selectedPayment.customerEmail && (
                    <p className="text-sm text-gray-500">{selectedPayment.customerEmail}</p>
                  )}
                  {selectedPayment.customerPhone && (
                    <p className="text-sm text-gray-500">{selectedPayment.customerPhone}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="font-medium text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                    <span className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Transaction ID</Label>
                  <p className="font-medium">{selectedPayment.transactionId || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Trip</Label>
                  <p className="font-medium">{selectedPayment.tripName}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.routeName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bus</Label>
                  <p className="font-medium">{selectedPayment.busName}</p>
                  {selectedPayment.busNumber && (
                    <p className="text-sm text-gray-500">{selectedPayment.busNumber}</p>
                  )}
                </div>
              </div>

              {(selectedPayment.seatNumber || selectedPayment.boardingPoint || selectedPayment.droppingPoint) && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedPayment.seatNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Seat</Label>
                      <p className="font-medium">{selectedPayment.seatNumber}</p>
                    </div>
                  )}
                  {selectedPayment.boardingPoint && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Boarding Point</Label>
                      <p className="font-medium">{selectedPayment.boardingPoint}</p>
                    </div>
                  )}
                  {selectedPayment.droppingPoint && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Dropping Point</Label>
                      <p className="font-medium">{selectedPayment.droppingPoint}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Date</Label>
                  <p className="font-medium">{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Departure Date</Label>
                  <p className="font-medium">{new Date(selectedPayment.departureDate).toLocaleDateString()}</p>
                  {selectedPayment.departureTime && (
                    <p className="text-sm text-gray-500">{selectedPayment.departureTime}</p>
                  )}
                </div>
              </div>

              {selectedPayment.processedByName && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Processed By</Label>
                  <p className="font-medium">{selectedPayment.processedByName}</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedPayment.notes}</p>
                </div>
              )}

              {(selectedPayment.refundAmount || selectedPayment.refundReason) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Refund Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPayment.refundAmount && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Refund Amount</Label>
                        <p className="font-medium">{formatCurrency(selectedPayment.refundAmount)}</p>
                      </div>
                    )}
                    {selectedPayment.refundReason && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Refund Reason</Label>
                        <p className="text-sm">{selectedPayment.refundReason}</p>
                      </div>
                    )}
                    {selectedPayment.refundDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Refund Date</Label>
                        <p className="text-sm">{formatDate(selectedPayment.refundDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
