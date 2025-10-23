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
import { Search, Filter, DollarSign, TrendingUp, Download, Eye, RefreshCw, CreditCard, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

interface StorePayment {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_money' | 'bank_transfer';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId?: string;
  gatewayResponse?: string;
  fees: number;
  netAmount: number;
  processedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StorePaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<StorePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<StorePayment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store/payments');
      const data = await response.json();
      if (data.success) {
        // Normalize to StorePayment shape expected by UI
        const normalized: StorePayment[] = (data.payments || []).map((p: any) => {
          const fees = Math.round((p.amount * 0.02) * 100) / 100; // 2% fee default
          const netAmount = Math.max(0, (p.amount || 0) - fees);
          return {
            _id: p._id,
            orderId: p.orderId,
            orderNumber: p.orderNumber,
            customerId: '',
            customerName: p.customerName || 'Customer',
            customerEmail: '',
            amount: p.amount || 0,
            currency: 'ZMW',
            paymentMethod: (p.method || 'cash') as StorePayment['paymentMethod'],
            paymentStatus: (p.status || 'pending') as StorePayment['paymentStatus'],
            transactionId: undefined,
            gatewayResponse: undefined,
            fees,
            netAmount,
            processedAt: undefined,
            refundedAt: undefined,
            refundAmount: undefined,
            refundReason: undefined,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.createdAt || new Date().toISOString(),
          };
        });
        setPayments(normalized);
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

  const handleRefund = async (paymentId: string) => {
    const refundAmount = prompt('Enter refund amount:');
    const refundReason = prompt('Enter refund reason:');
    
    if (!refundAmount || !refundReason) return;
    
    try {
      // Mock refund - in real implementation, this would call an API
      setPayments(payments.map(payment => 
        payment._id === paymentId 
          ? { 
              ...payment, 
              paymentStatus: 'refunded' as const,
              refundAmount: parseFloat(refundAmount),
              refundReason: refundReason,
              refundedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : payment
      ));
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const handleDownloadInvoice = (payment: StorePayment) => {
    const invoiceContent = `
      <html>
        <head>
          <title>Invoice - ${payment.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Invoice</h1>
            <p>Order: ${payment.orderNumber}</p>
          </div>
          
          <div class="details">
            <h3>Payment Details</h3>
            <p><strong>Customer:</strong> ${payment.customerName}</p>
            <p><strong>Email:</strong> ${payment.customerEmail}</p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${payment.transactionId || 'N/A'}</p>
            <p><strong>Date:</strong> ${format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
          </div>
          
          <table class="table">
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Order Total</td>
              <td>${payment.currency} ${payment.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Processing Fees</td>
              <td>${payment.currency} ${payment.fees.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td>Net Amount</td>
              <td>${payment.currency} ${payment.netAmount.toFixed(2)}</td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${payment.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Amount', 'Currency', 'Payment Method', 'Status', 'Fees', 'Net Amount', 'Date'],
      ...payments.map(payment => [
        payment.orderNumber,
        payment.customerName,
        payment.amount.toFixed(2),
        payment.currency,
        payment.paymentMethod,
        payment.paymentStatus,
        payment.fees.toFixed(2),
        payment.netAmount.toFixed(2),
        format(new Date(payment.createdAt), 'yyyy-MM-dd HH:mm')
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      completed: { variant: 'default' as const, label: 'Completed' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
      refunded: { variant: 'outline' as const, label: 'Refunded' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'mobile_money':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.paymentStatus === 'completed').length;
  const pendingPayments = payments.filter(p => p.paymentStatus === 'pending').length;
  const totalRevenue = payments.filter(p => p.paymentStatus === 'completed').reduce((sum, p) => sum + p.netAmount, 0);
  const totalFees = payments.reduce((sum, p) => sum + p.fees, 0);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-600">Manage payment transactions and refunds</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPayments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Fees: ZMW {totalFees.toFixed(2)}</p>
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
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Payment transactions and refund management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.customerName}</div>
                        <div className="text-sm text-gray-500">{payment.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.currency} {payment.amount.toFixed(2)}</div>
                      {payment.fees > 0 && (
                        <div className="text-sm text-gray-500">
                          Fees: {payment.currency} {payment.fees.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(payment.paymentMethod)}
                        <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.paymentStatus)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.currency} {payment.netAmount.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Payment Details - {payment.orderNumber}</DialogTitle>
                              <DialogDescription>
                                Complete payment information and transaction details
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayment && (
                              <div className="space-y-6">
                                {/* Payment Summary */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-2">Payment Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Order Number:</strong> {selectedPayment.orderNumber}</div>
                                      <div><strong>Transaction ID:</strong> {selectedPayment.transactionId || 'N/A'}</div>
                                      <div><strong>Payment Method:</strong> {selectedPayment.paymentMethod}</div>
                                      <div><strong>Status:</strong> {getStatusBadge(selectedPayment.paymentStatus)}</div>
                                      <div><strong>Currency:</strong> {selectedPayment.currency}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-2">Customer Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Name:</strong> {selectedPayment.customerName}</div>
                                      <div><strong>Email:</strong> {selectedPayment.customerEmail}</div>
                                      <div><strong>Customer ID:</strong> {selectedPayment.customerId}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div>
                                  <h3 className="font-semibold mb-2">Payment Breakdown</h3>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Order Amount:</span>
                                      <span>{selectedPayment.currency} {selectedPayment.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Processing Fees:</span>
                                      <span>{selectedPayment.currency} {selectedPayment.fees.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t pt-2">
                                      <span>Net Amount:</span>
                                      <span>{selectedPayment.currency} {selectedPayment.netAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Transaction Details */}
                                <div>
                                  <h3 className="font-semibold mb-2">Transaction Details</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Created:</strong> {format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                                    {selectedPayment.processedAt && (
                                      <div><strong>Processed:</strong> {format(new Date(selectedPayment.processedAt), 'MMM dd, yyyy HH:mm')}</div>
                                    )}
                                    {selectedPayment.refundedAt && (
                                      <div><strong>Refunded:</strong> {format(new Date(selectedPayment.refundedAt), 'MMM dd, yyyy HH:mm')}</div>
                                    )}
                                    {selectedPayment.gatewayResponse && (
                                      <div><strong>Gateway Response:</strong> {selectedPayment.gatewayResponse}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Refund Information */}
                                {selectedPayment.refundAmount && (
                                  <div>
                                    <h3 className="font-semibold mb-2">Refund Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Refund Amount:</strong> {selectedPayment.currency} {selectedPayment.refundAmount.toFixed(2)}</div>
                                      <div><strong>Refund Reason:</strong> {selectedPayment.refundReason}</div>
                                      <div><strong>Refund Date:</strong> {format(new Date(selectedPayment.refundedAt!), 'MMM dd, yyyy HH:mm')}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-between">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleDownloadInvoice(selectedPayment)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Invoice
                                  </Button>
                                  
                                  {selectedPayment.paymentStatus === 'completed' && !selectedPayment.refundAmount && (
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleRefund(selectedPayment._id)}
                                    >
                                      Process Refund
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
