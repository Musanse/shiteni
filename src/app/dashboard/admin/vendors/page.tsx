'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';

interface Vendor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  address: string;
  city: string;
  country: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  kycStatus: 'pending' | 'verified' | 'rejected';
  documents: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  createdAt: string;
  approvedAt?: string;
  suspendedAt?: string;
  totalProducts?: number;
  totalOrders?: number;
  revenue?: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  // const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/vendors');
      const data = await response.json();
      
      if (data.success) {
        setVendors(data.vendors || []);
      } else {
        setError(data.error || 'Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVendors(vendors.map(vendor => 
          vendor._id === vendorId 
            ? { ...vendor, status: newStatus as any, approvedAt: newStatus === 'approved' ? new Date().toISOString() : vendor.approvedAt }
            : vendor
        ));
        
        alert(`Vendor status changed to ${newStatus}`);
      } else {
        setError(data.error || 'Failed to update vendor status');
        alert(`Error: ${data.error || 'Failed to update vendor status'}`);
      }
    } catch (error) {
      console.error('Error updating vendor status:', error);
      setError('Failed to update vendor status');
      alert('Error: Failed to update vendor status');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${vendor.firstName} ${vendor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'rejected':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Approve vendors to allow them to list products and services on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">{vendors.length}</span>
          <span className="text-muted-foreground">Total Vendors</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              {vendors.filter(v => v.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.status === 'suspended').length}</div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.kycStatus === 'verified').length}</div>
            <p className="text-xs text-muted-foreground">Identity verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
          <CardDescription>Review and approve vendors to enable product listing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.firstName} {vendor.lastName}</div>
                      <div className="text-sm text-muted-foreground">{vendor.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.businessName}</div>
                      <div className="text-sm text-muted-foreground">{vendor.businessType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {vendor.city}, {vendor.country}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                  <TableCell>{getKycBadge(vendor.kycStatus)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setShowVendorModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Always show approve button for pending vendors */}
                      {vendor.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(vendor._id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                          title="Approve Vendor"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Always show reject button for pending vendors */}
                      {vendor.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(vendor._id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                          title="Reject Vendor"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Show suspend button for approved vendors */}
                      {vendor.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(vendor._id, 'suspended')}
                          className="text-orange-600 hover:text-orange-700"
                          title="Suspend Vendor"
                        >
                          Suspend
                        </Button>
                      )}
                      
                      {/* Show reactivate button for suspended vendors */}
                      {vendor.status === 'suspended' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(vendor._id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                          title="Reactivate Vendor"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Show approve button for rejected vendors */}
                      {vendor.status === 'rejected' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(vendor._id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                          title="Approve Vendor"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVendors.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No vendors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No vendors have registered yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Detail Modal */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedVendor.businessName}</CardTitle>
                  <CardDescription>
                    {selectedVendor.firstName} {selectedVendor.lastName} • {selectedVendor.businessType}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedVendor.status)}
                  {getKycBadge(selectedVendor.kycStatus)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowVendorModal(false);
                    setSelectedVendor(null);
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedVendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedVendor.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedVendor.address}, {selectedVendor.city}, {selectedVendor.country}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Business Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Business Type:</span>
                      <div className="font-medium">{selectedVendor.businessType}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Registration Date:</span>
                      <div className="font-medium">{new Date(selectedVendor.createdAt).toLocaleDateString()}</div>
                    </div>
                    {selectedVendor.approvedAt && (
                      <div>
                        <span className="text-sm text-muted-foreground">Approved Date:</span>
                        <div className="font-medium">{new Date(selectedVendor.approvedAt).toLocaleDateString()}</div>
                      </div>
                    )}
                    {selectedVendor.suspendedAt && (
                      <div>
                        <span className="text-sm text-muted-foreground">Suspended Date:</span>
                        <div className="font-medium">{new Date(selectedVendor.suspendedAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Statistics */}
              <div>
                <h4 className="font-medium mb-3">Business Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{selectedVendor.totalProducts}</div>
                    <div className="text-sm text-muted-foreground">Total Products</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedVendor.totalOrders}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">${selectedVendor.revenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedVendor.documents && selectedVendor.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Documents</h4>
                  <div className="space-y-2">
                    {selectedVendor.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.type}</span>
                          <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                {selectedVendor.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => {
                        handleStatusChange(selectedVendor._id, 'approved');
                        setShowVendorModal(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Vendor
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleStatusChange(selectedVendor._id, 'rejected');
                        setShowVendorModal(false);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Reject Vendor
                    </Button>
                  </>
                )}
                {selectedVendor.status === 'approved' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedVendor._id, 'suspended');
                      setShowVendorModal(false);
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Suspend Vendor
                  </Button>
                )}
                {selectedVendor.status === 'suspended' && (
                  <Button 
                    onClick={() => {
                      handleStatusChange(selectedVendor._id, 'approved');
                      setShowVendorModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate Vendor
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowVendorModal(false);
                    setSelectedVendor(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
