'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

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
import { Users, Search, Filter, Phone, Mail, MapPin, Clock, Calendar, Eye, Edit, Trash2, Plus, UserCheck, UserX, Shield, Star, AlertCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  hireDate: string;
  salary: number;
  shift: 'morning' | 'afternoon' | 'night' | 'flexible';
  emergencyContact?: string;
  address?: string;
  skills: string[];
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
  lastLogin?: string;
  notes?: string;
  role: 'staff' | 'manager';
  kycStatus: 'pending' | 'approved' | 'rejected';
  tempPassword?: string;
}

export default function HotelStaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    salary: '',
    shift: 'flexible',
    role: 'receptionist',
    password: ''
  });

  // Fetch staff data from API
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotel/staff');
      const data = await response.json();
      
      if (data.success) {
        const staffData = data.staff || [];
        console.log('Frontend - Received staff data:', staffData);
        setStaff(staffData);
        setFilteredStaff(staffData);
      } else {
        console.error('Failed to fetch staff:', data.error);
        setNotification({ type: 'error', message: 'Failed to fetch staff data' });
        setStaff([]);
        setFilteredStaff([]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setNotification({ type: 'error', message: 'Failed to fetch staff data' });
      setStaff([]);
      setFilteredStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = staff || [];

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member?.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member?.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(member => member?.department === departmentFilter);
    }

    setFilteredStaff(filtered);
  }, [searchTerm, statusFilter, departmentFilter, staff]);

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPerformanceBadge = (performance: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      'needs-improvement': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[performance as keyof typeof colors]}>
        {performance.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingStaff ? '/api/hotel/staff/update' : '/api/hotel/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      
      const payload = editingStaff 
        ? { staffId: editingStaff.id, ...formData }
        : formData;

      console.log('Frontend - Sending payload:', payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ 
          type: 'success', 
          message: editingStaff ? 'Staff updated successfully' : 'Staff created successfully' 
        });
        
        if (data.staff?.tempPassword) {
          setNotification({ 
            type: 'success', 
            message: `Staff created! Temporary password: ${data.staff.tempPassword}` 
          });
        }
        
        setIsDialogOpen(false);
        setEditingStaff(null);
        resetForm();
        fetchStaff(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to save staff' });
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      setNotification({ type: 'error', message: 'Failed to save staff' });
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      salary: '',
      shift: 'flexible',
      role: 'receptionist',
      password: ''
    });
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      firstName: member.name.split(' ')[0] || '',
      lastName: member.name.split(' ').slice(1).join(' ') || '',
      email: member.email,
      phone: member.phone,
      department: member.department,
      salary: member.salary.toString(),
      shift: member.shift,
      role: member.role,
      password: '' // Don't populate password for security
    });
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to terminate this staff member?')) return;

    try {
      const response = await fetch(`/api/hotel/staff/update?staffId=${staffId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Staff member terminated successfully' });
        fetchStaff(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to terminate staff' });
      }
    } catch (error) {
      console.error('Error terminating staff:', error);
      setNotification({ type: 'error', message: 'Failed to terminate staff' });
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch('/api/hotel/staff/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ 
          type: 'success', 
          message: `Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` 
        });
        fetchStaff(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setNotification({ type: 'error', message: 'Failed to update status' });
    }
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
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {notification.message}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setNotification(null)}
            className="ml-auto"
          >
            ×
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage hotel staff, schedules, and performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStaff(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </DialogTitle>
              <DialogDescription>
                {editingStaff ? 'Update staff member details' : 'Add a new staff member to your hotel'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@hotel.com" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+260 97 123 4567" 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingStaff ? "Leave blank to keep current password" : "Enter password"}
                    required={!editingStaff}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Office">Front Office</SelectItem>
                      <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="Guest Services">Guest Services</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salary">Salary (ZMW)</Label>
                  <Input 
                    id="salary" 
                    type="number" 
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    placeholder="40000" 
                  />
                </div>
                <div>
                  <Label htmlFor="shift">Shift</Label>
                  <Select 
                    value={formData.shift} 
                    onValueChange={(value) => setFormData({...formData, shift: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Add Staff')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                  placeholder="Search staff..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Front Office">Front Office</SelectItem>
                <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                <SelectItem value="Guest Services">Guest Services</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
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
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-green-600">
                  {staff.filter(s => s.status === 'active').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {staff.filter(s => s.status === 'on-leave').length}
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
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {staff.filter(s => s.performance === 'excellent').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    {getStatusBadge(member.status)}
                    {getPerformanceBadge(member.performance)}
                    <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                      {member.role === 'manager' ? 'Manager' : 'Staff'}
                    </Badge>
                    {member.kycStatus === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        KYC Pending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{member.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{member.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{member.shift} shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">ZMW {member.salary.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Hired: {member.hireDate}</span>
                    </div>
                    {member.lastLogin && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last login: {member.lastLogin}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {(member.skills || []).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {member.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Notes:</strong> {member.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditStaff(member)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleStatus(member.id, member.status)}
                  >
                    {member.status === 'active' ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteStaff(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Terminate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No staff found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No staff members have been added yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
