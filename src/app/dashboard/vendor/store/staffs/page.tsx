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
import { Search, Users, Plus, Edit, Trash2, Eye, Shield, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { hasPermission } from '@/lib/permissions';

interface StoreStaff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'cashier' | 'inventory_manager' | 'sales_associate' | 'admin';
  department: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoreStaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StoreStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StoreStaff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StoreStaff | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'sales_associate',
    department: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store/staff');
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff || []);
      } else {
        setError(data.error || 'Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Client-side validation
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      const res = await fetch('/api/store/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create');
      await fetchStaff();
      setShowAddForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'sales_associate',
        department: '',
        permissions: []
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      setError('Failed to add staff member');
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleStatusToggle = async (staffId: string) => {
    try {
      const member = staff.find(s => s._id === staffId);
      if (!member) return;
      const newStatus = member.isActive ? 'inactive' : 'active';
      const res = await fetch(`/api/store/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      setStaff(prev => prev.map(m => m._id === staffId ? { ...m, isActive: !m.isActive, updatedAt: new Date().toISOString() } : m));
    } catch (error) {
      console.error('Error updating staff status:', error);
    }
  };

  const handleEditStaff = (member: StoreStaff) => {
    setEditingStaff(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      password: '', // Don't pre-fill password for security
      role: member.role,
      department: member.department,
      permissions: member.permissions
    });
    setError(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    try {
      // Client-side validation
      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      const updateData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        department: string;
        permissions: string[];
        password?: string;
      } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const res = await fetch(`/api/store/staff/${editingStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      
      await fetchStaff(); // Refresh the list
      setEditingStaff(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'sales_associate',
        department: '',
        permissions: []
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      setError('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/store/staff/${staffId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      
      await fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff member');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      manager: { variant: 'default' as const, label: 'Manager' },
      cashier: { variant: 'secondary' as const, label: 'Cashier' },
      inventory_manager: { variant: 'outline' as const, label: 'Inventory Manager' },
      sales_associate: { variant: 'secondary' as const, label: 'Sales Associate' },
      admin: { variant: 'destructive' as const, label: 'Admin' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.sales_associate;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="default" className="bg-green-500">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.isActive).length;
  const admins = staff.filter(s => s.role === 'admin').length;
  const cashiers = staff.filter(s => s.role === 'cashier').length;

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view staff</p>
      </div>
    );
  }

  // Check if user has permission to access staff management
  const userRole = (session.user as { role?: string })?.role;
  if (!hasPermission(userRole || '', '/dashboard/vendor/store/staffs')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to access staff management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-600">Manage your store staff and permissions</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={(open) => {
          setShowAddForm(open);
          if (open) setError(null); // Clear errors when opening form
        }}>
          <DialogTrigger asChild>
            <Button disabled={!['manager', 'admin'].includes(userRole || '')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
              <DialogDescription>
                {editingStaff ? 'Update staff information and permissions' : 'Create a new staff account with appropriate permissions'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">{editingStaff ? 'New Password (optional)' : 'Password *'}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={editingStaff ? "Leave blank to keep current password" : "Enter password for staff member"}
                  required={!editingStaff}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingStaff 
                    ? "Leave blank to keep current password, or enter new password (minimum 6 characters)"
                    : "Staff member will use this password to log in (minimum 6 characters)"
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                      <SelectItem value="sales_associate">Sales Associate</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Department *</label>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Permissions</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'view_all',
                    'edit_products',
                    'manage_orders',
                    'manage_inventory',
                    'view_reports',
                    'process_orders',
                    'manage_staff',
                    'manage_customers'
                  ].map(permission => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                      <span className="text-sm">{permission.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  setEditingStaff(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    password: '',
                    role: 'sales_associate',
                    department: '',
                    permissions: []
                  });
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStaff}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{admins}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{cashiers}</div>
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
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                <SelectItem value="sales_associate">Sales Associate</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>
            Manage staff accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Loading staff...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No staff members found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                        <div className="text-sm text-gray-500">
                          Joined {format(new Date(member.createdAt), 'MMM yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>{getStatusBadge(member.isActive)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.lastLogin 
                          ? format(new Date(member.lastLogin), 'MMM dd, yyyy')
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedStaff(member)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Staff Details - {member.firstName} {member.lastName}</DialogTitle>
                              <DialogDescription>
                                Complete staff information and permissions
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStaff && (
                              <div className="space-y-6">
                                {/* Staff Info */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-2">Personal Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Name:</strong> {selectedStaff.firstName} {selectedStaff.lastName}</div>
                                      <div><strong>Email:</strong> {selectedStaff.email}</div>
                                      <div><strong>Phone:</strong> {selectedStaff.phone}</div>
                                      <div><strong>Role:</strong> {getRoleBadge(selectedStaff.role)}</div>
                                      <div><strong>Department:</strong> {selectedStaff.department}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-2">Account Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Status:</strong> {getStatusBadge(selectedStaff.isActive)}</div>
                                      <div><strong>Last Login:</strong> {selectedStaff.lastLogin ? format(new Date(selectedStaff.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}</div>
                                      <div><strong>Created:</strong> {format(new Date(selectedStaff.createdAt), 'MMM dd, yyyy')}</div>
                                      <div><strong>Updated:</strong> {format(new Date(selectedStaff.updatedAt), 'MMM dd, yyyy')}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                  <h3 className="font-semibold mb-2">Permissions</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {selectedStaff.permissions.map(permission => (
                                      <Badge key={permission} variant="outline">
                                        {permission.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between">
                                  <Button 
                                    variant={selectedStaff.isActive ? "destructive" : "default"}
                                    onClick={() => handleStatusToggle(selectedStaff._id)}
                                  >
                                    {selectedStaff.isActive ? 'Deactivate' : 'Activate'} Account
                                  </Button>
                                  
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline"
                                      disabled={!['manager', 'admin'].includes(userRole || '')}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      disabled={!['manager', 'admin'].includes(userRole || '')}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!['manager', 'admin'].includes(userRole || '')}
                          onClick={() => {
                            handleEditStaff(member);
                            setShowAddForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!['manager', 'admin'].includes(userRole || '')}
                          onClick={() => handleDeleteStaff(member._id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
