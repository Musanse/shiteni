'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  UserPlus,
  Shield,
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  ShoppingCart,
  Pill,
  Bus,
  UserCheck,
  UserX
} from 'lucide-react';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  businessType?: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
}

export default function StaffsPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/staffs');
        const data = await response.json();
      
      if (data.success) {
        setStaffs(data.staffs || []);
      } else {
        setError(data.error || 'Failed to fetch staffs');
      }
    } catch (error) {
      console.error('Error fetching staffs:', error);
      setError('Failed to fetch staffs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (staffId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/staffs/${staffId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStaffs(staffs.map(staff => 
          staff._id === staffId 
            ? { ...staff, status: newStatus as any }
            : staff
        ));
      } else {
        setError(data.error || 'Failed to update staff status');
      }
    } catch (error) {
      console.error('Error updating staff status:', error);
      setError('Failed to update staff status');
    }
  };

  const filteredStaffs = staffs.filter(staff => {
    const matchesSearch = staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'receptionist':
      case 'housekeeping':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'cashier':
      case 'inventory_manager':
      case 'sales_associate':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'pharmacist':
      case 'technician':
        return <Pill className="h-4 w-4 text-red-600" />;
      case 'driver':
      case 'conductor':
      case 'dispatcher':
        return <Bus className="h-4 w-4 text-orange-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'receptionist': 'bg-blue-100 text-blue-800',
      'housekeeping': 'bg-blue-100 text-blue-800',
      'cashier': 'bg-green-100 text-green-800',
      'inventory_manager': 'bg-green-100 text-green-800',
      'sales_associate': 'bg-green-100 text-green-800',
      'pharmacist': 'bg-red-100 text-red-800',
      'technician': 'bg-red-100 text-red-800',
      'driver': 'bg-orange-100 text-orange-800',
      'conductor': 'bg-orange-100 text-orange-800',
      'dispatcher': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {getRoleIcon(role)}
        <span className="ml-1 capitalize">{role.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const roleOptions = [
    'all', 'receptionist', 'housekeeping', 'cashier', 'inventory_manager', 
    'sales_associate', 'pharmacist', 'technician', 'driver', 'conductor', 'dispatcher'
  ];

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
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Create and manage staff with role-based access</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowCreateForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Staff
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{staffs.length}</span>
            <span className="text-muted-foreground">Total Staff</span>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffs.length}</div>
            <p className="text-xs text-muted-foreground">
              {staffs.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotel Staff</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffs.filter(s => ['receptionist', 'housekeeping'].includes(s.role)).length}</div>
            <p className="text-xs text-muted-foreground">Hotel operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Staff</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffs.filter(s => ['cashier', 'inventory_manager', 'sales_associate'].includes(s.role)).length}</div>
            <p className="text-xs text-muted-foreground">Retail operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Staff</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffs.filter(s => ['driver', 'conductor', 'dispatcher'].includes(s.role)).length}</div>
            <p className="text-xs text-muted-foreground">Transport operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>View and manage all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
              <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Roles</option>
              {roleOptions.filter(role => role !== 'all').map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
              </select>
              <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
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
                  <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Business Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredStaffs.map((staff) => (
                <TableRow key={staff._id}>
                      <TableCell>
                          <div>
                            <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                      <div className="text-sm text-muted-foreground">{staff.email}</div>
                        </div>
                      </TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                      <TableCell>
                    <Badge variant="outline">
                      {staff.businessType || 'General'}
                    </Badge>
                      </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                      {staff.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {staff.phone}
                        </div>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(staff.status)}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                      <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                      {staff.status === 'active' && (
                                <Button
                          variant="outline"
                                  size="sm"
                          onClick={() => handleStatusChange(staff._id, 'suspended')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Suspend
                                </Button>
                      )}
                      {staff.status === 'suspended' && (
                                <Button
                                  size="sm"
                          onClick={() => handleStatusChange(staff._id, 'active')}
                          className="bg-green-600 hover:bg-green-700"
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

          {filteredStaffs.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No staff found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No staff members have been created yet.'
                }
                </p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
