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
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Eye,
  X,
  Check,
  RefreshCw,
  Download,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface InsuranceClaim {
  _id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  submissionDate: string;
  processedDate?: string;
  notes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface OrderForInsurance {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount: number;
  orderDate: string;
  status: string;
  medicineCount: number;
  medicines: {
    name: string;
    quantity: number;
    totalPrice: number;
  }[];
}

export default function PharmacyInsurancePage() {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [orders, setOrders] = useState<OrderForInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderForInsurance | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    insuranceProvider: 'nhima', // Set default insurance provider
    policyNumber: '',
    claimAmount: '',
    notes: ''
  });

  useEffect(() => {
    fetchClaims();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/pharmacy/insurance/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/insurance/claims');
      const data = await response.json();
      
      if (data.success) {
        setClaims(data.claims || []);
      } else {
        setError(data.error || 'Failed to fetch insurance claims');
      }
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
      setError('Failed to fetch insurance claims');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔍 Form data being sent:', formData);
      const response = await fetch('/api/pharmacy/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          claimAmount: parseFloat(formData.claimAmount)
        }),
      });

      const data = await response.json();
      console.log('🔍 API response:', data);
      if (data.success) {
        setClaims([...claims, data.claim]);
        setFormData({
          patientId: '', patientName: '', insuranceProvider: 'nhima', policyNumber: '', claimAmount: '', notes: ''
        });
        setShowAddForm(false);
        setError(null);
      } else {
        setError(data.error || 'Failed to add insurance claim');
      }
    } catch (error) {
      console.error('Error adding insurance claim:', error);
      setError('Failed to add insurance claim');
    }
  };

  const handleDeleteClaim = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insurance claim?')) return;

    try {
      setIsDeleting(id);
      const response = await fetch(`/api/pharmacy/insurance/claims/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setClaims(claims.filter(c => c._id !== id));
      } else {
        setError(data.error || 'Failed to delete insurance claim');
      }
    } catch (error) {
      console.error('Error deleting insurance claim:', error);
      setError('Failed to delete insurance claim');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleOrderSelect = (order: OrderForInsurance) => {
    setSelectedOrder(order);
    setFormData({
      patientId: order.orderNumber, // Use order number as patient ID
      patientName: order.customerName,
      insuranceProvider: 'nhima', // Set default insurance provider
      policyNumber: `POL-${order.orderNumber}`, // Generate a default policy number
      claimAmount: order.totalAmount.toString(),
      notes: `Insurance claim for order ${order.orderNumber} - ${order.medicineCount} medicines`
    });
  };

  const handleUpdateClaimStatus = async (claimId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(claimId);
      const response = await fetch(`/api/pharmacy/insurance/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setClaims(claims.map(claim => 
          claim._id === claimId 
            ? { ...claim, status: newStatus as any, processedDate: new Date().toISOString() }
            : claim
        ));
        setError(null);
      } else {
        setError(data.error || 'Failed to update claim status');
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      setError('Failed to update claim status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleViewClaimDetails = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setShowClaimDetails(true);
  };

  const handleDownloadClaim = (claim: InsuranceClaim) => {
    // Create a simple text file with claim details
    const claimDetails = `
Insurance Claim Report
====================

Claim Number: ${claim.claimNumber}
Patient Name: ${claim.patientName}
Patient ID: ${claim.patientId}
Insurance Provider: ${claim.insuranceProvider}
Policy Number: ${claim.policyNumber}
Claim Amount: K ${claim.claimAmount.toFixed(2)}
${claim.approvedAmount ? `Approved Amount: K ${claim.approvedAmount.toFixed(2)}` : ''}
Status: ${claim.status.toUpperCase()}
Submission Date: ${format(new Date(claim.submissionDate), 'MMM d, yyyy')}
${claim.processedDate ? `Processed Date: ${format(new Date(claim.processedDate), 'MMM d, yyyy')}` : ''}
${claim.notes ? `Notes: ${claim.notes}` : ''}
    `.trim();

    const blob = new Blob([claimDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-${claim.claimNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaims(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const handleSelectAllClaims = () => {
    if (selectedClaims.length === filteredClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(filteredClaims.map(claim => claim._id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdatingStatus('bulk');
      const promises = selectedClaims.map(claimId => 
        fetch(`/api/pharmacy/insurance/claims/${claimId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      if (results.every(r => r.success)) {
        setClaims(claims.map(claim => 
          selectedClaims.includes(claim._id)
            ? { ...claim, status: newStatus as any, processedDate: new Date().toISOString() }
            : claim
        ));
        setSelectedClaims([]);
        setError(null);
      } else {
        setError('Some claims failed to update');
      }
    } catch (error) {
      console.error('Error updating bulk claims:', error);
      setError('Failed to update claims');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      processing: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.insuranceProvider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view insurance claims</p>
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
          <h1 className="text-3xl font-bold text-foreground">Insurance Claims</h1>
          <p className="text-muted-foreground">Manage insurance claims and reimbursements</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/pharmacy/insurance/sample-orders', {
                  method: 'POST',
                });
                const data = await response.json();
                if (data.success) {
                  alert(data.message);
                  fetchOrders(); // Refresh orders
                } else {
                  alert('Failed to create sample orders: ' + data.error);
                }
              } catch (error) {
                console.error('Error creating sample orders:', error);
                alert('Failed to create sample orders');
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sample Orders
          </Button>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Claim
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Insurance Claim</DialogTitle>
              <DialogDescription>
                Submit a new insurance claim for patient reimbursement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClaim} className="space-y-4">
              {/* Order Selection */}
              <div>
                <Label htmlFor="orderSelect">Select Order (Optional)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Available orders: {orders.length} {orders.length === 0 && '(Click "Create Sample Orders" to generate test data)'}
                </p>
                <Select onValueChange={(value) => {
                  const order = orders.find(o => o._id === value);
                  if (order) handleOrderSelect(order);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order to auto-fill details" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.length === 0 ? (
                      <SelectItem value="no-orders" disabled>
                        No orders available - Create sample orders first
                      </SelectItem>
                    ) : (
                      orders.map((order) => (
                        <SelectItem key={order._id} value={order._id}>
                          {order.orderNumber} - {order.customerName} - ZMW {order.totalAmount.toFixed(2)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedOrder && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-green-800">
                          <strong>Selected Order:</strong> {selectedOrder.orderNumber} - {selectedOrder.customerName}
                        </p>
                        <p className="text-sm text-green-600">
                          Amount: ZMW {selectedOrder.totalAmount.toFixed(2)} • Medicines: {selectedOrder.medicineCount}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(null);
                          setFormData({
                            patientId: '',
                            patientName: '',
                            insuranceProvider: 'nhima', // Set default insurance provider
                            policyNumber: '',
                            claimAmount: '',
                            notes: ''
                          });
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient ID *</Label>
                  <Input
                    id="patientId"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                  <Select value={formData.insuranceProvider} onValueChange={(value) => setFormData({ ...formData, insuranceProvider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nhima">NHIMA</SelectItem>
                      <SelectItem value="medlife">MedLife</SelectItem>
                      <SelectItem value="zambia_national">Zambia National Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="policyNumber">Policy Number *</Label>
                  <Input
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="claimAmount">Claim Amount (ZMW) *</Label>
                <Input
                  id="claimAmount"
                  type="number"
                  step="0.01"
                  value={formData.claimAmount}
                  onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Claim
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
            <p className="text-xs text-muted-foreground">
              {claims.filter(c => c.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.filter(c => c.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.filter(c => c.status === 'approved').length}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              K {claims.reduce((sum, c) => sum + c.claimAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All claims</p>
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
                  placeholder="Search claims..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedClaims.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedClaims.length} claim{selectedClaims.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClaims([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('approved')}
                  disabled={isUpdatingStatus === 'bulk'}
                  className="text-green-600 hover:text-green-700"
                >
                  {isUpdatingStatus === 'bulk' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  disabled={isUpdatingStatus === 'bulk'}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('processing')}
                  disabled={isUpdatingStatus === 'bulk'}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Mark Processing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    alert(`Sending ${selectedClaims.length} claims to insurance providers`);
                  }}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims ({filteredClaims.length})</CardTitle>
          <CardDescription>Manage insurance claims and reimbursements</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No insurance claims found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                      onChange={handleSelectAllClaims}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedClaims.includes(claim._id)}
                        onChange={() => handleSelectClaim(claim._id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(claim.status)}
                        <span className="font-medium">{claim.claimNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.patientName}</div>
                        <div className="text-sm text-gray-500">ID: {claim.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.insuranceProvider}</div>
                        <div className="text-sm text-gray-500">{claim.policyNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">K {claim.claimAmount.toFixed(2)}</div>
                        {claim.approvedAmount && (
                          <div className="text-sm text-green-600">
                            Approved: K {claim.approvedAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(claim.submissionDate), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {/* View Details Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewClaimDetails(claim)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Status-specific action buttons */}
                        {claim.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim._id, 'approved')}
                              disabled={isUpdatingStatus === claim._id}
                              className="text-green-600 hover:text-green-700"
                              title="Approve Claim"
                            >
                              {isUpdatingStatus === claim._id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim._id, 'rejected')}
                              disabled={isUpdatingStatus === claim._id}
                              className="text-red-600 hover:text-red-700"
                              title="Reject Claim"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim._id, 'processing')}
                              disabled={isUpdatingStatus === claim._id}
                              className="text-blue-600 hover:text-blue-700"
                              title="Mark as Processing"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {claim.status === 'processing' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim._id, 'approved')}
                              disabled={isUpdatingStatus === claim._id}
                              className="text-green-600 hover:text-green-700"
                              title="Approve Claim"
                            >
                              {isUpdatingStatus === claim._id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim._id, 'rejected')}
                              disabled={isUpdatingStatus === claim._id}
                              className="text-red-600 hover:text-red-700"
                              title="Reject Claim"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {/* Download Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadClaim(claim)}
                          title="Download Claim Report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        {/* Send to Provider Button */}
                        {claim.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // This would typically open an email client or integration
                              alert(`Sending claim ${claim.claimNumber} to ${claim.insuranceProvider}`);
                            }}
                            title="Send to Insurance Provider"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClaim(claim._id)}
                          disabled={isDeleting === claim._id}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Claim"
                        >
                          {isDeleting === claim._id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Claim Details Dialog */}
      <Dialog open={showClaimDetails} onOpenChange={setShowClaimDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedClaim?.claimNumber}</DialogTitle>
            <DialogDescription>
              Complete information for this insurance claim
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Patient Name</Label>
                  <p className="text-lg font-semibold">{selectedClaim.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Patient ID</Label>
                  <p className="text-lg">{selectedClaim.patientId}</p>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Insurance Provider</Label>
                  <p className="text-lg font-semibold capitalize">{selectedClaim.insuranceProvider}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Policy Number</Label>
                  <p className="text-lg">{selectedClaim.policyNumber}</p>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Claim Amount</Label>
                  <p className="text-2xl font-bold text-green-600">K {selectedClaim.claimAmount.toFixed(2)}</p>
                </div>
                {selectedClaim.approvedAmount && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approved Amount</Label>
                    <p className="text-2xl font-bold text-blue-600">K {selectedClaim.approvedAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Status and Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedClaim.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Submission Date</Label>
                  <p className="text-lg">{format(new Date(selectedClaim.submissionDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {selectedClaim.processedDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Processed Date</Label>
                  <p className="text-lg">{format(new Date(selectedClaim.processedDate), 'MMM d, yyyy')}</p>
                </div>
              )}

              {/* Notes */}
              {selectedClaim.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-lg bg-gray-50 p-3 rounded-md">{selectedClaim.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadClaim(selectedClaim)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button onClick={() => setShowClaimDetails(false)}>
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
