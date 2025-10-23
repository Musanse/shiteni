'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Payment {
  _id: string;
  paymentType: 'booking' | 'purchase' | 'subscription' | 'refund' | 'deposit';
  serviceType: 'hotel' | 'bus' | 'store' | 'pharmacy' | 'general';
  serviceName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer' | 'cash';
  transactionId: string;
  reference: string;
  description: string;
  relatedBookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/customer/payments');
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.paymentType === typeFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesMethod;
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📋';
      case 'purchase': return '🛒';
      case 'subscription': return '🔄';
      case 'refund': return '↩️';
      case 'deposit': return '💰';
      default: return '💳';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return '💳';
      case 'mobile_money': return '📱';
      case 'bank_transfer': return '🏦';
      case 'cash': return '💵';
      default: return '💳';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openView = (payment: Payment) => {
    setViewPayment(payment);
  };

  const downloadReceipt = (payment: Payment) => {
    const receiptHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt - ${payment.reference}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .title { font-size: 20px; font-weight: 700; }
      .badge { padding: 2px 8px; border-radius: 9999px; font-size: 12px; border: 1px solid #e5e7eb; }
      .row { margin: 8px 0; }
      .label { color: #6b7280; width: 160px; display: inline-block; }
      .total { font-size: 18px; font-weight: 700; margin-top: 16px; }
      .muted { color: #6b7280; }
      .divider { height: 1px; background: #e5e7eb; margin: 16px 0; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">Payment Receipt</div>
      <div class="badge">${payment.status.toUpperCase()}</div>
    </div>
    <div class="row"><span class="label">Reference:</span><span>${payment.reference}</span></div>
    <div class="row"><span class="label">Transaction:</span><span>${payment.transactionId}</span></div>
    <div class="row"><span class="label">Service:</span><span>${payment.serviceType.toUpperCase()}</span></div>
    <div class="row"><span class="label">Type:</span><span>${payment.paymentType.toUpperCase()}</span></div>
    <div class="row"><span class="label">Method:</span><span>${payment.paymentMethod.replace('_',' ').toUpperCase()}</span></div>
    <div class="row"><span class="label">Date:</span><span>${formatDate(payment.createdAt)}</span></div>
    ${payment.description ? `<div class="row"><span class="label">Description:</span><span>${payment.description}</span></div>` : ''}
    <div class="divider"></div>
    <div class="total">Amount: ${formatCurrency(payment.amount, payment.currency)}</div>
    <p class="muted">This is a system generated receipt.</p>
    <script>window.onload = () => { window.print(); }</script>
  </body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback: trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.reference}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Calculate statistics
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const failedPayments = payments.filter(p => p.status === 'failed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-2">View and manage all your payments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalAmount, 'ZMW')}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200">Completed</p>
                <p className="text-2xl font-bold text-white">{completedPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200">Pending</p>
                <p className="text-2xl font-bold text-white">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200">Failed</p>
                <p className="text-2xl font-bold text-white">{failedPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200">Total Payments</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid gap-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t made any payments yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-md transition-shadow bg-[#2d5f3f] text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{getTypeIcon(payment.paymentType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {payment.serviceName}
                        </h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Transaction: {payment.transactionId}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMethodIcon(payment.paymentMethod)}</span>
                            <span className="text-white">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(payment.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Reference:</span>
                            <span>{payment.reference}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Service:</span>
                            <span className="text-white">{payment.serviceType.toUpperCase()}</span>
                          </div>
                          
                          {payment.description && (
                            <div className="text-gray-200">
                              {payment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-2">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openView(payment)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReceipt(payment)}>
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Payment Modal */}
      <Dialog open={!!viewPayment} onOpenChange={() => setViewPayment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Reference: {viewPayment?.reference}
            </DialogDescription>
          </DialogHeader>
          {viewPayment && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">{viewPayment.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium">{viewPayment.serviceType.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{viewPayment.paymentType.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{viewPayment.paymentMethod.replace('_',' ').toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{formatDate(viewPayment.createdAt)}</span>
              </div>
              {viewPayment.description && (
                <div>
                  <div className="text-gray-500">Description</div>
                  <div>{viewPayment.description}</div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold">{formatCurrency(viewPayment.amount, viewPayment.currency)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
