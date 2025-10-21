'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Users,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Truck,
  Calendar,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Image from 'next/image';

interface BusCompanySettings {
  companyName: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  operatingHours: {
    start: string;
    end: string;
  };
  features: {
    onlineBooking: boolean;
    seatSelection: boolean;
    mobileApp: boolean;
    notifications: boolean;
    loyaltyProgram: boolean;
    groupBookings: boolean;
  };
  policies: {
    cancellationPolicy: string;
    refundPolicy: string;
    termsOfService: string;
    privacyPolicy: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    companyImage: string;
  };
}

export default function BusSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<BusCompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusCompanySettings>({
    companyName: '',
    description: '',
    address: '',
    city: '',
    country: 'Zambia',
    phone: '',
    email: '',
    website: '',
    currency: 'ZMW',
    timezone: 'Africa/Lusaka',
    operatingHours: {
      start: '06:00',
      end: '22:00'
    },
    features: {
      onlineBooking: true,
      seatSelection: true,
      mobileApp: false,
      notifications: true,
      loyaltyProgram: false,
      groupBookings: true
    },
    policies: {
      cancellationPolicy: '',
      refundPolicy: '',
      termsOfService: '',
      privacyPolicy: ''
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logo: '',
      companyImage: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // Debug effect to monitor image state changes
  useEffect(() => {
    console.log('Image state changed:', {
      imagePreview,
      companyImage: formData.branding?.companyImage,
      hasImagePreview: !!imagePreview,
      hasCompanyImage: !!(formData.branding?.companyImage && formData.branding.companyImage.trim() !== '')
    });
  }, [imagePreview, formData.branding?.companyImage]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bus/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        
        // Ensure all fields have proper default values to prevent controlled/uncontrolled input errors
        const safeSettings = {
          companyName: data.settings.companyName || '',
          description: data.settings.description || '',
          address: data.settings.address || '',
          city: data.settings.city || '',
          country: data.settings.country || 'Zambia',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          website: data.settings.website || '',
          currency: data.settings.currency || 'ZMW',
          timezone: data.settings.timezone || 'Africa/Lusaka',
          operatingHours: {
            start: data.settings.operatingHours?.start || '06:00',
            end: data.settings.operatingHours?.end || '22:00'
          },
          features: {
            onlineBooking: data.settings.features?.onlineBooking ?? true,
            seatSelection: data.settings.features?.seatSelection ?? true,
            mobileApp: data.settings.features?.mobileApp ?? false,
            notifications: data.settings.features?.notifications ?? true,
            loyaltyProgram: data.settings.features?.loyaltyProgram ?? false,
            groupBookings: data.settings.features?.groupBookings ?? true
          },
          policies: {
            cancellationPolicy: data.settings.policies?.cancellationPolicy || '',
            refundPolicy: data.settings.policies?.refundPolicy || '',
            termsOfService: data.settings.policies?.termsOfService || '',
            privacyPolicy: data.settings.policies?.privacyPolicy || ''
          },
          branding: {
            primaryColor: data.settings.branding?.primaryColor || '#3B82F6',
            secondaryColor: data.settings.branding?.secondaryColor || '#1E40AF',
            logo: data.settings.branding?.logo || '',
            companyImage: data.settings.branding?.companyImage || ''
          }
        };
        
        setFormData(safeSettings);
        
        // Set image preview if company image exists
        if (safeSettings.branding.companyImage) {
          setImagePreview(safeSettings.branding.companyImage);
        } else {
          setImagePreview(null);
        }
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/bus/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setSettings(formData);
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
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

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof BusCompanySettings],
        [field]: value
      }
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'company-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.imageUrl;
        console.log('Image uploaded successfully:', imageUrl);
        setImagePreview(imageUrl);
        updateNestedFormData('branding', 'companyImage', imageUrl);
        
        // Automatically save the image to the database
        await saveImageToDatabase(imageUrl);
        
        setSuccess('Company image uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      handleImageUpload(file);
    }
  };

  const removeImage = async () => {
    console.log('Removing image...');
    setImagePreview(null);
    updateNestedFormData('branding', 'companyImage', '');
    
    // Automatically save the removal to the database
    await saveImageToDatabase('');
    
    setSuccess('Company image removed successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const saveImageToDatabase = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/bus/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branding: {
            ...formData.branding,
            companyImage: imageUrl
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Image saved to database successfully');
      } else {
        console.error('Failed to save image to database:', data.error);
      }
    } catch (error) {
      console.error('Error saving image to database:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your bus company settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Basic information about your bus company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief description of your bus company"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="Enter website URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Contact
          </CardTitle>
          <CardDescription>
            Physical location and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData('address', e.target.value)}
              placeholder="Enter full address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => updateFormData('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Settings
          </CardTitle>
          <CardDescription>
            Operating hours and business preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => updateFormData('currency', e.target.value)}
                placeholder="ZMW"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => updateFormData('timezone', e.target.value)}
                placeholder="Africa/Lusaka"
              />
            </div>
            <div>
              <Label>Operating Hours</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={formData.operatingHours?.start || '06:00'}
                  onChange={(e) => updateNestedFormData('operatingHours', 'start', e.target.value)}
                />
                <span>to</span>
                <Input
                  type="time"
                  value={formData.operatingHours?.end || '22:00'}
                  onChange={(e) => updateNestedFormData('operatingHours', 'end', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Features
          </CardTitle>
          <CardDescription>
            Enable or disable various features for your bus service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <Label>Online Booking</Label>
                </div>
                <Switch
                  checked={formData.features.onlineBooking}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'onlineBooking', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <Label>Seat Selection</Label>
                </div>
                <Switch
                  checked={formData.features.seatSelection}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'seatSelection', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <Label>Group Bookings</Label>
                </div>
                <Switch
                  checked={formData.features.groupBookings}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'groupBookings', checked)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <Label>Notifications</Label>
                </div>
                <Switch
                  checked={formData.features.notifications}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <Label>Loyalty Program</Label>
                </div>
                <Switch
                  checked={formData.features.loyaltyProgram}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'loyaltyProgram', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <Label>Mobile App</Label>
                </div>
                <Switch
                  checked={formData.features.mobileApp}
                  onCheckedChange={(checked) => updateNestedFormData('features', 'mobileApp', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policies
          </CardTitle>
          <CardDescription>
            Terms, conditions, and policies for your bus service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
            <Textarea
              id="cancellationPolicy"
              value={formData.policies.cancellationPolicy}
              onChange={(e) => updateNestedFormData('policies', 'cancellationPolicy', e.target.value)}
              placeholder="Describe your cancellation policy..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="refundPolicy">Refund Policy</Label>
            <Textarea
              id="refundPolicy"
              value={formData.policies.refundPolicy}
              onChange={(e) => updateNestedFormData('policies', 'refundPolicy', e.target.value)}
              placeholder="Describe your refund policy..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="termsOfService">Terms of Service</Label>
            <Textarea
              id="termsOfService"
              value={formData.policies.termsOfService}
              onChange={(e) => updateNestedFormData('policies', 'termsOfService', e.target.value)}
              placeholder="Enter your terms of service..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="privacyPolicy">Privacy Policy</Label>
            <Textarea
              id="privacyPolicy"
              value={formData.policies.privacyPolicy}
              onChange={(e) => updateNestedFormData('policies', 'privacyPolicy', e.target.value)}
              placeholder="Enter your privacy policy..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Company Image
          </CardTitle>
          <CardDescription>
            Upload a company image that will be displayed on the customer side
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Image Preview */}
            {(imagePreview || (formData.branding?.companyImage && formData.branding.companyImage.trim() !== '')) && (
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  <Image
                    src={imagePreview || formData.branding?.companyImage || ''}
                    alt="Company image preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Company image preview
                </p>
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="company-image" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {uploadingImage ? 'Uploading...' : 'Upload company image'}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </Label>
                  <Input
                    id="company-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('company-image')?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingImage ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Image URL Input (Alternative) */}
            <div>
              <Label htmlFor="companyImageUrl">Or enter image URL</Label>
              <Input
                id="companyImageUrl"
                value={formData.branding?.companyImage || ''}
                onChange={(e) => {
                  updateNestedFormData('branding', 'companyImage', e.target.value);
                  setImagePreview(e.target.value);
                }}
                placeholder="Enter company image URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize the appearance of your bus service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.branding?.primaryColor || '#3B82F6'}
                  onChange={(e) => updateNestedFormData('branding', 'primaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.branding?.primaryColor || '#3B82F6'}
                  onChange={(e) => updateNestedFormData('branding', 'primaryColor', e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.branding?.secondaryColor || '#1E40AF'}
                  onChange={(e) => updateNestedFormData('branding', 'secondaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.branding?.secondaryColor || '#1E40AF'}
                  onChange={(e) => updateNestedFormData('branding', 'secondaryColor', e.target.value)}
                  placeholder="#1E40AF"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={formData.branding?.logo || ''}
              onChange={(e) => updateNestedFormData('branding', 'logo', e.target.value)}
              placeholder="Enter logo URL"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
