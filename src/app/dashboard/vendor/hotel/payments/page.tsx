'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Search, Filter, Calendar, Clock, DollarSign, Receipt, Eye, Download, AlertCircle, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  _id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'mobile_money' | 'crypto';
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId: string;
  processedAt: string;
  processedBy: string;
  refundAmount?: number;
  refundReason?: string;
  notes?: string;
  currency: string;
  fees: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function HotelPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch payments from database
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // First try to fetch direct payment records
      const paymentsResponse = await fetch('/api/hotel/payments');
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const directPayments = paymentsData.payments || [];
        
        if (directPayments.length > 0) {
          // Use direct payment records if they exist
          setPayments(directPayments);
          setFilteredPayments(directPayments);
          return;
        }
      }
      
      // Fallback: Fetch payment data from bookings and customers
      console.log('No direct payment records found, fetching from bookings and customers...');
      
      const [bookingsResponse, customersResponse] = await Promise.all([
        fetch('/api/hotel/bookings'),
        fetch('/api/hotel/bookings?status=checked-out')
      ]);
      
      const allPayments = [];
      
      // Process bookings data
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.bookings || [];
        
        // Convert bookings to payment format
        bookings.forEach(booking => {
          if (booking.paymentMethod && booking.totalAmount > 0) {
            // Calculate fees based on payment method
            let fees = 0;
            if (booking.paymentMethod === 'credit_card' || booking.paymentMethod === 'debit_card') {
              fees = booking.totalAmount * 0.029; // 2.9% processing fee
            } else if (booking.paymentMethod === 'bank_transfer') {
              fees = booking.totalAmount * 0.01; // 1% bank fee
            } else if (booking.paymentMethod === 'mobile_money') {
              fees = booking.totalAmount * 0.015; // 1.5% mobile money fee
            }
            // Cash payments have no fees
            
            const netAmount = booking.totalAmount - fees;
            
            allPayments.push({
              _id: `booking_${booking._id}`,
              bookingId: booking._id,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              customerPhone: booking.customerPhone,
              roomNumber: booking.roomNumber,
              roomType: booking.roomType,
              amount: booking.totalAmount,
              paymentMethod: booking.paymentMethod,
              paymentStatus: booking.paymentStatus === 'paid' ? 'completed' : 'pending',
              transactionId: `TXN${booking.bookingNumber?.replace('BK', '') || booking._id.slice(-6)}`,
              processedAt: booking.createdAt,
              processedBy: booking.vendorId,
              currency: 'ZMW',
              fees,
              netAmount,
              notes: `Payment for booking ${booking.bookingNumber}`,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt
            });
          }
        });
      }
      
      // Process customers data (checked-out bookings)
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        const customers = customersData.bookings || [];
        
        // Convert customers to payment format (avoid duplicates)
        customers.forEach(customer => {
          if (customer.paymentMethod && customer.totalAmount > 0) {
            // Check if we already have this booking from the bookings fetch
            const existingPayment = allPayments.find(p => p.bookingId === customer._id);
            
            if (!existingPayment) {
              // Calculate fees based on payment method
              let fees = 0;
              if (customer.paymentMethod === 'credit_card' || customer.paymentMethod === 'debit_card') {
                fees = customer.totalAmount * 0.029; // 2.9% processing fee
              } else if (customer.paymentMethod === 'bank_transfer') {
                fees = customer.totalAmount * 0.01; // 1% bank fee
              } else if (customer.paymentMethod === 'mobile_money') {
                fees = customer.totalAmount * 0.015; // 1.5% mobile money fee
              }
              // Cash payments have no fees
              
              const netAmount = customer.totalAmount - fees;
              
              allPayments.push({
                _id: `customer_${customer._id}`,
                bookingId: customer._id,
                customerName: customer.customerName,
                customerEmail: customer.customerEmail,
                customerPhone: customer.customerPhone,
                roomNumber: customer.roomNumber,
                roomType: customer.roomType,
                amount: customer.totalAmount,
                paymentMethod: customer.paymentMethod,
                paymentStatus: customer.paymentStatus === 'paid' ? 'completed' : 'pending',
                transactionId: `TXN${customer.bookingNumber?.replace('BK', '') || customer._id.slice(-6)}`,
                processedAt: customer.createdAt,
                processedBy: customer.vendorId,
                currency: 'ZMW',
                fees,
                netAmount,
                notes: `Payment for booking ${customer.bookingNumber}`,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt
              });
            }
          }
        });
      }
      
      // Sort payments by processed date (newest first)
      allPayments.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
      
      setPayments(allPayments);
      setFilteredPayments(allPayments);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPayments();
    }
  }, [session]);

  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.roomNumber.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentStatus === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, methodFilter, payments]);

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      'partially_refunded': 'bg-orange-100 text-orange-800'
    };

    const icons = {
      completed: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      refunded: <CheckCircle className="h-3 w-3" />,
      'partially_refunded': <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1">{status.replace('_', ' ').toUpperCase()}</span>
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      credit_card: 'bg-blue-100 text-blue-800',
      debit_card: 'bg-purple-100 text-purple-800',
      cash: 'bg-green-100 text-green-800',
      bank_transfer: 'bg-gray-100 text-gray-800',
      mobile_money: 'bg-orange-100 text-orange-800',
      crypto: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colors[method as keyof typeof colors]}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleRefund = async (paymentId: string) => {
    try {
      const refundAmount = prompt('Enter refund amount (leave empty for full refund):');
      if (refundAmount === null) return; // User cancelled
      
      const refundReason = prompt('Enter refund reason:');
      if (!refundReason) {
        alert('Refund reason is required');
        return;
      }

      const amount = refundAmount ? parseFloat(refundAmount) : null;
      
      const response = await fetch(`/api/hotel/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refundAmount: amount,
          refundReason: refundReason,
          paymentStatus: amount ? 'partially_refunded' : 'refunded'
        }),
      });

      if (response.ok) {
        console.log('Refund processed successfully');
        // Refresh payments data
        fetchPayments();
      } else {
        const error = await response.json();
        console.error('Failed to process refund:', error);
        alert('Failed to process refund: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    }
  };

  const handleDownloadInvoice = (payment: Payment) => {
    // Create invoice HTML content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.transactionId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .customer-details { margin-bottom: 20px; }
          .payment-details { margin-bottom: 20px; }
          .total { font-weight: bold; font-size: 18px; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HOTEL INVOICE</h1>
          <p>Transaction ID: ${payment.transactionId}</p>
        </div>
        
        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Date:</strong> ${format(new Date(payment.processedAt), 'MMMM dd, yyyy')}</p>
          <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
          <p><strong>Booking ID:</strong> ${payment.bookingId}</p>
        </div>
        
        <div class="customer-details">
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${payment.customerName}</p>
          <p><strong>Email:</strong> ${payment.customerEmail}</p>
          <p><strong>Phone:</strong> ${payment.customerPhone}</p>
        </div>
        
        <div class="payment-details">
          <h3>Payment Details</h3>
          <table>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Room ${payment.roomNumber} - ${payment.roomType}</td>
              <td>ZMW {payment.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Processing Fee</td>
              <td>ZMW {payment.fees.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td>Total Amount</td>
              <td>ZMW {payment.netAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div class="payment-info">
          <h3>Payment Information</h3>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Payment Status:</strong> ${payment.paymentStatus.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Currency:</strong> ${payment.currency}</p>
        </div>
        
        ${payment.refundAmount ? `
        <div class="refund-info">
          <h3>Refund Information</h3>
          <p><strong>Refund Amount:</strong> ZMW {payment.refundAmount.toFixed(2)}</p>
          <p><strong>Refund Reason:</strong> ${payment.refundReason}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is an automated invoice generated by the hotel management system.</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${payment.transactionId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    // Create CSV content for Excel compatibility
    const csvContent = [
      // Header row
      [
        'Transaction ID',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Room Number',
        'Room Type',
        'Amount',
        'Payment Method',
        'Payment Status',
        'Fees',
        'Net Amount',
        'Currency',
        'Processed Date',
        'Refund Amount',
        'Refund Reason',
        'Notes'
      ],
      // Data rows
      ...payments.map(payment => [
        payment.transactionId,
        payment.customerName,
        payment.customerEmail,
        payment.customerPhone,
        payment.roomNumber,
        payment.roomType,
        payment.amount.toFixed(2),
        payment.paymentMethod.replace('_', ' ').toUpperCase(),
        payment.paymentStatus.replace('_', ' ').toUpperCase(),
        payment.fees.toFixed(2),
        payment.netAmount.toFixed(2),
        payment.currency,
        format(new Date(payment.processedAt), 'yyyy-MM-dd HH:mm:ss'),
        payment.refundAmount ? payment.refundAmount.toFixed(2) : '',
        payment.refundReason || '',
        payment.notes || ''
      ])
    ];

    // Convert to CSV string
    const csvString = csvContent.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvString;

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">Manage hotel payments, transactions, and refunds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment
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
                  placeholder="Search payments..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
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
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ZMW {payments.filter(p => p.paymentStatus === 'completed').reduce((sum, payment) => sum + payment.netAmount, 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => p.paymentStatus === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Payments</p>
                <p className="text-2xl font-bold text-red-600">
                  {payments.filter(p => p.paymentStatus === 'failed').length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.map((payment) => (
          <Card key={payment._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{payment.customerName}</h3>
                    {getStatusBadge(payment.paymentStatus)}
                    {getMethodBadge(payment.paymentMethod)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      <span>Booking: {payment.bookingId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">Room {payment.roomNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>ZMW {payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(payment.processedAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Transaction ID: {payment.transactionId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Processed by: {payment.processedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Fees: ZMW {payment.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Net: ZMW {payment.netAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {payment.refundAmount && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm">
                        <strong>Refund:</strong> ZMW {payment.refundAmount} - {payment.refundReason}
                      </p>
                    </div>
                  )}

                  {payment.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Notes:</strong> {payment.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {payment.paymentStatus === 'completed' && !payment.refundAmount && (
                    <Button variant="outline" size="sm" onClick={() => handleRefund(payment._id)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Refund
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(payment)}>
                    <Download className="h-4 w-4 mr-2" />
                    Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No payments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No payments have been processed yet.'}
            </p>
            {!searchTerm && statusFilter === 'all' && methodFilter === 'all' && (
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Payment records are automatically created when:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bookings are confirmed or checked-in</li>
                  <li>Payment method is selected during booking</li>
                  <li>Booking status is updated to confirmed</li>
                </ul>
                <p className="mt-4">
                  <strong>Data Sources:</strong> This page fetches payment data from:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Direct payment records (when available)</li>
                  <li>Confirmed bookings with payment methods</li>
                  <li>Checked-out customers with payment history</li>
                </ul>
                <p className="mt-4">
                  <strong>To see payments:</strong> Go to Bookings page and confirm some bookings with payment methods.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about payment {selectedPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <p className="text-sm font-medium">{selectedPayment.customerName}</p>
                </div>
                <div>
                  <Label>Booking ID</Label>
                  <p className="text-sm font-medium">{selectedPayment.bookingId}</p>
                </div>
                <div>
                  <Label>Room Number</Label>
                  <p className="text-sm font-medium">{selectedPayment.roomNumber}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="text-sm font-medium">ZMW {selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="text-sm font-medium">{selectedPayment.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm font-medium">{selectedPayment.paymentStatus.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label>Transaction ID</Label>
                  <p className="text-sm font-medium">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <Label>Processed At</Label>
                  <p className="text-sm font-medium">{format(new Date(selectedPayment.processedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Processed By</Label>
                  <p className="text-sm font-medium">{selectedPayment.processedBy}</p>
                </div>
                <div>
                  <Label>Fees</Label>
                  <p className="text-sm font-medium">ZMW {selectedPayment.fees.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Net Amount</Label>
                  <p className="text-sm font-medium">ZMW {selectedPayment.netAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Currency</Label>
                  <p className="text-sm font-medium">{selectedPayment.currency}</p>
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <p className="text-sm font-medium">{selectedPayment.customerEmail}</p>
                </div>
                <div>
                  <Label>Customer Phone</Label>
                  <p className="text-sm font-medium">{selectedPayment.customerPhone}</p>
                </div>
                <div>
                  <Label>Room Type</Label>
                  <p className="text-sm font-medium">{selectedPayment.roomType}</p>
                </div>
              </div>
              {selectedPayment.refundAmount && (
                <div>
                  <Label>Refund Amount</Label>
                  <p className="text-sm font-medium">ZMW {selectedPayment.refundAmount}</p>
                </div>
              )}
              {selectedPayment.refundReason && (
                <div>
                  <Label>Refund Reason</Label>
                  <p className="text-sm">{selectedPayment.refundReason}</p>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
