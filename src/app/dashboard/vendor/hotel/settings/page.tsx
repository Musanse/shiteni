'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Hotel, Users, CreditCard, Bell, Shield, Globe, Save, Upload, Download, Eye, EyeOff } from 'lucide-react';

export default function HotelSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hotelInfo, setHotelInfo] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    timezone: 'Africa/Lusaka',
    currency: 'ZMW',
    language: 'en',
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in',
      pets: 'Pets allowed with additional fee',
      smoking: 'Non-smoking property',
      ageRestriction: 'Children under 12 stay free'
    }
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: true,
    guestMessages: true,
    systemUpdates: false
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: 'strong',
    loginAttempts: 5,
    ipWhitelist: '',
    auditLog: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    acceptedMethods: ['credit_card', 'debit_card', 'cash', 'mobile_money'],
    processingFee: 2.5,
    refundPolicy: 'Full refund within 24 hours',
    taxRate: 10,
    serviceCharge: 5,
    currency: 'ZMW'
  });

  // Fetch hotel settings on component mount
  useEffect(() => {
    const fetchHotelSettings = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch('/api/hotel/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
          const settings = data.settings;
          setHotelInfo({
            name: settings.name || '',
            description: settings.description || '',
            address: settings.address || '',
            phone: settings.phone || '',
            email: settings.email || '',
            website: settings.website || '',
            checkInTime: settings.checkInTime || '15:00',
            checkOutTime: settings.checkOutTime || '11:00',
            timezone: settings.timezone || 'Africa/Lusaka',
            currency: settings.currency || 'ZMW',
            language: settings.language || 'en',
            amenities: settings.amenities || ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
            policies: settings.policies || {
              cancellation: 'Free cancellation up to 24 hours before check-in',
              pets: 'Pets allowed with additional fee',
              smoking: 'Non-smoking property',
              ageRestriction: 'Children under 12 stay free'
            }
          });
          
          if (settings.notifications) {
            setNotifications(settings.notifications);
          }
          
          if (settings.security) {
            setSecurity(settings.security);
          }
          
          if (settings.paymentSettings) {
            setPaymentSettings(settings.paymentSettings);
          }
          
          if (settings.galleryImages) {
            console.log('Loading gallery images:', settings.galleryImages);
            setGalleryImages(settings.galleryImages);
          }
        }
      } catch (error) {
        console.error('Error fetching hotel settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchHotelSettings();
  }, []);

  const handleSave = async (section: string) => {
    setLoading(true);
    setMessage(null); // Clear any existing messages
    
    try {
      const response = await fetch('/api/hotel/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: hotelInfo.name,
          description: hotelInfo.description,
          address: hotelInfo.address,
          city: hotelInfo.address.split(',')[1]?.trim() || '',
          country: 'Zambia',
          phone: hotelInfo.phone,
          email: hotelInfo.email,
          website: hotelInfo.website,
          currency: hotelInfo.currency,
          timezone: hotelInfo.timezone,
          language: hotelInfo.language,
          checkInTime: hotelInfo.checkInTime,
          checkOutTime: hotelInfo.checkOutTime,
          amenities: hotelInfo.amenities,
          policies: hotelInfo.policies,
          notifications: notifications,
          security: security,
          paymentSettings: paymentSettings,
          galleryImages: galleryImages
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${section} settings saved successfully!` });
        console.log(`${section} settings saved successfully`);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: `Error: ${data.error}` });
        console.error('Error saving settings:', data.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings. Please try again.' });
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('Uploaded URLs:', uploadedUrls);
      setGalleryImages(prev => {
        const newImages = [...prev, ...uploadedUrls];
        console.log('Updated gallery images:', newImages);
        return newImages;
      });
      
      setMessage({ type: 'success', text: `${uploadedUrls.length} image(s) uploaded successfully!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading images:', error);
      setMessage({ type: 'error', text: 'Failed to upload images. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setMessage({ type: 'success', text: 'Image removed successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{message.text}</span>
            <button 
              onClick={() => setMessage(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {initialLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotel settings...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Hotel Settings</h1>
              <p className="text-muted-foreground">Configure your hotel's settings and preferences</p>
            </div>
            <Button onClick={() => handleSave('all')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hotel Information
              </CardTitle>
              <CardDescription>
                Basic information about your hotel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input
                    id="hotelName"
                    value={hotelInfo.name}
                    onChange={(e) => setHotelInfo({...hotelInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={hotelInfo.phone}
                    onChange={(e) => setHotelInfo({...hotelInfo, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={hotelInfo.email}
                    onChange={(e) => setHotelInfo({...hotelInfo, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={hotelInfo.website}
                    onChange={(e) => setHotelInfo({...hotelInfo, website: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={hotelInfo.address}
                  onChange={(e) => setHotelInfo({...hotelInfo, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={hotelInfo.description}
                  onChange={(e) => setHotelInfo({...hotelInfo, description: e.target.value})}
                />
              </div>
              <Button onClick={() => handleSave('general')} disabled={loading}>
                Save General Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hotel Policies</CardTitle>
              <CardDescription>
                Set your hotel's policies and rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check-in Time</Label>
                  <Input
                    id="checkIn"
                    type="time"
                    value={hotelInfo.checkInTime}
                    onChange={(e) => setHotelInfo({...hotelInfo, checkInTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out Time</Label>
                  <Input
                    id="checkOut"
                    type="time"
                    value={hotelInfo.checkOutTime}
                    onChange={(e) => setHotelInfo({...hotelInfo, checkOutTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={hotelInfo.timezone} onValueChange={(value) => setHotelInfo({...hotelInfo, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-12">UTC-12</SelectItem>
                      <SelectItem value="UTC-11">UTC-11</SelectItem>
                      <SelectItem value="UTC-10">UTC-10</SelectItem>
                      <SelectItem value="UTC-9">UTC-9</SelectItem>
                      <SelectItem value="UTC-8">UTC-8</SelectItem>
                      <SelectItem value="UTC-7">UTC-7</SelectItem>
                      <SelectItem value="UTC-6">UTC-6</SelectItem>
                      <SelectItem value="UTC-5">UTC-5</SelectItem>
                      <SelectItem value="UTC-4">UTC-4</SelectItem>
                      <SelectItem value="UTC-3">UTC-3</SelectItem>
                      <SelectItem value="UTC-2">UTC-2</SelectItem>
                      <SelectItem value="UTC-1">UTC-1</SelectItem>
                      <SelectItem value="UTC+0">UTC+0</SelectItem>
                      <SelectItem value="UTC+1">UTC+1</SelectItem>
                      <SelectItem value="UTC+2">UTC+2</SelectItem>
                      <SelectItem value="UTC+3">UTC+3</SelectItem>
                      <SelectItem value="UTC+4">UTC+4</SelectItem>
                      <SelectItem value="UTC+5">UTC+5</SelectItem>
                      <SelectItem value="UTC+6">UTC+6</SelectItem>
                      <SelectItem value="UTC+7">UTC+7</SelectItem>
                      <SelectItem value="UTC+8">UTC+8</SelectItem>
                      <SelectItem value="UTC+9">UTC+9</SelectItem>
                      <SelectItem value="UTC+10">UTC+10</SelectItem>
                      <SelectItem value="UTC+11">UTC+11</SelectItem>
                      <SelectItem value="UTC+12">UTC+12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={hotelInfo.currency} onValueChange={(value) => setHotelInfo({...hotelInfo, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancellation">Cancellation Policy</Label>
                  <Textarea
                    id="cancellation"
                    value={hotelInfo.policies.cancellation}
                    onChange={(e) => setHotelInfo({
                      ...hotelInfo,
                      policies: {...hotelInfo.policies, cancellation: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="pets">Pet Policy</Label>
                  <Textarea
                    id="pets"
                    value={hotelInfo.policies.pets}
                    onChange={(e) => setHotelInfo({
                      ...hotelInfo,
                      policies: {...hotelInfo.policies, pets: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="smoking">Smoking Policy</Label>
                  <Textarea
                    id="smoking"
                    value={hotelInfo.policies.smoking}
                    onChange={(e) => setHotelInfo({
                      ...hotelInfo,
                      policies: {...hotelInfo.policies, smoking: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="ageRestriction">Age Restriction Policy</Label>
                  <Textarea
                    id="ageRestriction"
                    value={hotelInfo.policies.ageRestriction}
                    onChange={(e) => setHotelInfo({
                      ...hotelInfo,
                      policies: {...hotelInfo.policies, ageRestriction: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Settings */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Hotel Gallery
              </CardTitle>
              <CardDescription>
                Upload and manage photos of your hotel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gallery-upload">Upload Images</Label>
                  <div className="mt-2">
                    <Input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Uploading images...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              {console.log('Gallery images state:', galleryImages)}
              {galleryImages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Gallery Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative overflow-hidden rounded-lg border">
                          <img
                            src={image}
                            alt={`Hotel image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(index)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {galleryImages.length === 0 && (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No images uploaded</h3>
                  <p className="text-muted-foreground">
                    Upload images to showcase your hotel
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={() => handleSave('gallery')} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Gallery
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bookingAlerts">Booking Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new bookings</p>
                  </div>
                  <Switch
                    id="bookingAlerts"
                    checked={notifications.bookingAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, bookingAlerts: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentAlerts">Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of payment updates</p>
                  </div>
                  <Switch
                    id="paymentAlerts"
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, paymentAlerts: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceAlerts">Maintenance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of maintenance issues</p>
                  </div>
                  <Switch
                    id="maintenanceAlerts"
                    checked={notifications.maintenanceAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, maintenanceAlerts: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="guestMessages">Guest Messages</Label>
                    <p className="text-sm text-muted-foreground">Get notified of guest messages</p>
                  </div>
                  <Switch
                    id="guestMessages"
                    checked={notifications.guestMessages}
                    onCheckedChange={(checked) => setNotifications({...notifications, guestMessages: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemUpdates">System Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified of system updates</p>
                  </div>
                  <Switch
                    id="systemUpdates"
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, systemUpdates: checked})}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('notifications')} disabled={loading}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditLog">Audit Log</Label>
                    <p className="text-sm text-muted-foreground">Keep track of all system activities</p>
                  </div>
                  <Switch
                    id="auditLog"
                    checked={security.auditLog}
                    onCheckedChange={(checked) => setSecurity({...security, auditLog: checked})}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                    <Input
                      id="loginAttempts"
                      type="number"
                      value={security.loginAttempts}
                      onChange={(e) => setSecurity({...security, loginAttempts: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select value={security.passwordPolicy} onValueChange={(value) => setSecurity({...security, passwordPolicy: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, numbers)</SelectItem>
                      <SelectItem value="strong">Strong (8+ chars, numbers, symbols)</SelectItem>
                      <SelectItem value="very-strong">Very Strong (12+ chars, mixed case, numbers, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="Enter IP addresses separated by commas"
                    value={security.ipWhitelist}
                    onChange={(e) => setSecurity({...security, ipWhitelist: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to allow all IPs
                  </p>
                </div>
              </div>
              <Button onClick={() => handleSave('security')} disabled={loading}>
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment methods and processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Accepted Payment Methods</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['credit_card', 'debit_card', 'cash', 'bank_transfer', 'mobile_money', 'crypto'].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method}
                          checked={paymentSettings.acceptedMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPaymentSettings({
                                ...paymentSettings,
                                acceptedMethods: [...paymentSettings.acceptedMethods, method]
                              });
                            } else {
                              setPaymentSettings({
                                ...paymentSettings,
                                acceptedMethods: paymentSettings.acceptedMethods.filter(m => m !== method)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={method} className="text-sm">
                          {method.replace('_', ' ').toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="processingFee">Processing Fee (%)</Label>
                    <Input
                      id="processingFee"
                      type="number"
                      step="0.1"
                      value={paymentSettings.processingFee}
                      onChange={(e) => setPaymentSettings({...paymentSettings, processingFee: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={paymentSettings.taxRate}
                      onChange={(e) => setPaymentSettings({...paymentSettings, taxRate: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                    <Input
                      id="serviceCharge"
                      type="number"
                      step="0.1"
                      value={paymentSettings.serviceCharge}
                      onChange={(e) => setPaymentSettings({...paymentSettings, serviceCharge: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={paymentSettings.currency} onValueChange={(value) => setPaymentSettings({...paymentSettings, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="refundPolicy">Refund Policy</Label>
                  <Textarea
                    id="refundPolicy"
                    value={paymentSettings.refundPolicy}
                    onChange={(e) => setPaymentSettings({...paymentSettings, refundPolicy: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('payments')} disabled={loading}>
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={hotelInfo.language} onValueChange={(value) => setHotelInfo({...hotelInfo, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hotel Amenities</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'concierge', 'room-service', 'laundry'].map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={amenity}
                          checked={hotelInfo.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHotelInfo({
                                ...hotelInfo,
                                amenities: [...hotelInfo.amenities, amenity]
                              });
                            } else {
                              setHotelInfo({
                                ...hotelInfo,
                                amenities: hotelInfo.amenities.filter(a => a !== amenity)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={amenity} className="text-sm">
                          {amenity.replace('-', ' ').toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSave('advanced')} disabled={loading}>
                Save Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
