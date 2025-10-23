'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Save,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

interface PharmacySettings {
  pharmacy: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    licenseNumber: string;
    registrationNumber: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  staff: {
    total: number;
    members: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      isActive: boolean;
      emailVerified: boolean;
      permissions: string[];
      createdAt: string;
      lastLogin: string;
    }>;
  };
  permissions: {
    canManageSettings: boolean;
    canManageStaff: boolean;
    canManageMedicines: boolean;
    canManageOrders: boolean;
  };
}

export default function PharmacySettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    licenseNumber: '',
    registrationNumber: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setFormData({
          businessName: data.settings.pharmacy.name || '',
          phoneNumber: data.settings.pharmacy.phone || '',
          address: data.settings.pharmacy.address || '',
          city: data.settings.pharmacy.city || '',
          country: data.settings.pharmacy.country || '',
          licenseNumber: data.settings.pharmacy.licenseNumber || '',
          registrationNumber: data.settings.pharmacy.registrationNumber || ''
        });
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/pharmacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSettings(prev => prev ? {
          ...prev,
          pharmacy: { ...prev.pharmacy, ...data.pharmacy }
        } : null);
        setIsEditing(false);
        alert('✅ Settings updated successfully!');
      } else {
        setError(data.error || 'Failed to update settings');
        alert(`❌ Failed to update settings: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
      alert('❌ Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      pharmacist: 'secondary',
      technician: 'outline',
      cashier: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Settings</h3>
          <p className="text-gray-500">Please wait while we fetch your pharmacy settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Settings</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchSettings}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Settings Found</h3>
          <p className="text-gray-500">Unable to load pharmacy settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Settings</h1>
          <p className="text-gray-600">Manage your pharmacy information and preferences</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} disabled={!settings.permissions.canManageSettings}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Pharmacy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Pharmacy Information</span>
          </CardTitle>
          <CardDescription>
            Basic information about your pharmacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Pharmacy Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter pharmacy name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={settings.pharmacy.email}
                  disabled
                  className="bg-gray-50"
                />
                {settings.pharmacy.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter license number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter registration number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Staff Members ({settings.staff.total})</span>
          </CardTitle>
          <CardDescription>
            Manage your pharmacy staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.staff.members.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                    <div className="text-sm text-gray-500">{staff.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(staff.role)}
                      {staff.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Inactive
                        </Badge>
                      )}
                      {staff.emailVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Created: {format(new Date(staff.createdAt), 'MMM d, yyyy')}</div>
                  {staff.lastLogin && (
                    <div>Last login: {format(new Date(staff.lastLogin), 'MMM d, yyyy')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Your Permissions</span>
          </CardTitle>
          <CardDescription>
            Your current access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {settings.permissions.canManageSettings ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={settings.permissions.canManageSettings ? 'text-green-700' : 'text-gray-500'}>
                Manage Settings
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {settings.permissions.canManageStaff ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={settings.permissions.canManageStaff ? 'text-green-700' : 'text-gray-500'}>
                Manage Staff
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {settings.permissions.canManageMedicines ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={settings.permissions.canManageMedicines ? 'text-green-700' : 'text-gray-500'}>
                Manage Medicines
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {settings.permissions.canManageOrders ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={settings.permissions.canManageOrders ? 'text-green-700' : 'text-gray-500'}>
                Manage Orders
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}