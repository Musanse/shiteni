'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Store, Bell, Shield, Palette, Globe, Save, Upload, Trash2, Download, User, Camera } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  storeCategory: string;
  contactEmail: string;
  contactPhone: string;
  profilePicture?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  currency: string;
  timezone: string;
  language: string;
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderNotifications: boolean;
    inventoryNotifications: boolean;
    customerNotifications: boolean;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
  };
}

export default function StoreSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    storeDescription: '',
    storeCategory: '',
    contactEmail: '',
    contactPhone: '',
    profilePicture: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Zambia',
      zipCode: ''
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '10:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    currency: 'ZMW',
    timezone: 'Africa/Lusaka',
    language: 'en',
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      inventoryNotifications: true,
      customerNotifications: true
    },
    appearance: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logo: '',
      favicon: ''
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/store/settings');
      const data = await response.json();
      
      if (data.success) {
        console.log('Profile picture loaded:', data.data.profilePicture);
        setSettings(data.data);
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
      setError(null);
      
      const response = await fetch('/api/store/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
        // Show success message (you could add a toast notification here)
        console.log('Settings saved successfully');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        console.log('Avatar uploaded successfully:', data.url);
        setSettings(prev => ({
          ...prev,
          profilePicture: data.url
        }));
        setError(null);
        setSuccessMessage('Avatar uploaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleNotificationsChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  const handleAppearanceChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [field]: value
      }
    }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value
      }
    }));
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value
        }
      }
    }));
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Store Settings</h1>
          <p className="text-gray-600">Configure your store preferences and settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your profile picture and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                    {successMessage}
                  </div>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}
                
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {settings.profilePicture ? (
                      <img
                        src={settings.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-white text-2xl font-bold">
                          {(session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload"
                      className={`absolute -bottom-2 -right-2 text-white rounded-full p-2 cursor-pointer transition-colors ${
                        uploadingAvatar 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {uploadingAvatar ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">
                      {session?.user?.name || session?.user?.email}
                    </h3>
                    <p className="text-gray-500">{session?.user?.email}</p>
                    <Badge variant="secondary" className="mt-2">
                      Store Owner
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                {/* Personal Information */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={session?.user?.name || session?.user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                </div>
              </div>
              
              <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      value={settings.storeName || ''}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeCategory">Store Category *</Label>
                    <Select value={settings.storeCategory || ''} onValueChange={(value) => handleInputChange('storeCategory', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={settings.storeDescription || ''}
                    onChange={(e) => handleInputChange('storeDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                    <Input
                      id="contactPhone"
                      value={settings.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Localization
                </CardTitle>
                <CardDescription>
                  Language, currency, and timezone settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.currency || 'ZMW'} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZMW">ZMW (Zambian Kwacha)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone || 'Africa/Lusaka'} onValueChange={(value) => handleInputChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Lusaka">Africa/Lusaka</SelectItem>
                        <SelectItem value="Africa/Harare">Africa/Harare</SelectItem>
                        <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={settings.language || 'en'} onValueChange={(value) => handleInputChange('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bem">Bemba</SelectItem>
                        <SelectItem value="ny">Nyanja</SelectItem>
                        <SelectItem value="toi">Tonga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Address</CardTitle>
                <CardDescription>
                  Physical location of your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={settings.address?.street || ''}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={settings.address?.city || ''}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={settings.address?.state || ''}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={settings.address?.zipCode || ''}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your store operating hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.businessHours || {}).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <Switch
                      checked={hours.isOpen}
                      onCheckedChange={(checked) => handleBusinessHoursChange(day, 'isOpen', checked)}
                    />
                    {hours.isOpen ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                          className="w-24"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.emailNotifications || false}
                      onCheckedChange={(checked) => handleNotificationsChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.smsNotifications || false}
                      onCheckedChange={(checked) => handleNotificationsChange('smsNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Order Notifications</Label>
                      <p className="text-sm text-gray-500">Get notified about new orders</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.orderNotifications || false}
                      onCheckedChange={(checked) => handleNotificationsChange('orderNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inventory Notifications</Label>
                      <p className="text-sm text-gray-500">Get notified about low stock</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.inventoryNotifications || false}
                      onCheckedChange={(checked) => handleNotificationsChange('inventoryNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Customer Notifications</Label>
                      <p className="text-sm text-gray-500">Get notified about customer messages</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.customerNotifications || false}
                      onCheckedChange={(checked) => handleNotificationsChange('customerNotifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Store Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.appearance?.primaryColor || '#3B82F6'}
                        onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.appearance?.primaryColor || '#3B82F6'}
                        onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.appearance?.secondaryColor || '#1E40AF'}
                        onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.appearance?.secondaryColor || '#1E40AF'}
                        onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="logo">Store Logo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="logo"
                        value={settings.appearance?.logo || ''}
                        onChange={(e) => handleAppearanceChange('logo', e.target.value)}
                        placeholder="Logo URL"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="favicon">Favicon</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="favicon"
                        value={settings.appearance?.favicon || ''}
                        onChange={(e) => handleAppearanceChange('favicon', e.target.value)}
                        placeholder="Favicon URL"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={settings.security?.twoFactorAuth || false}
                    onCheckedChange={(checked) => handleSecurityChange('twoFactorAuth', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select value={settings.security?.sessionTimeout?.toString() || '30'} onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select value={settings.security?.passwordPolicy || 'medium'} onValueChange={(value) => handleSecurityChange('passwordPolicy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ characters, mixed case)</SelectItem>
                      <SelectItem value="high">High (12+ characters, special chars)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Advanced configuration options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reset All Settings</Label>
                    <p className="text-sm text-gray-500">Reset all settings to default values</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export Settings</Label>
                    <p className="text-sm text-gray-500">Download your settings as a backup</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Import Settings</Label>
                    <p className="text-sm text-gray-500">Import settings from a backup file</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
