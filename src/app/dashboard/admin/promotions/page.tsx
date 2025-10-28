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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, Users, Building2, ShoppingBag, Pill, Bus, Loader2, Bed } from 'lucide-react';

interface PromotionsPageProps {}

export default function AdminPromotionsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Email content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Recipient selection
  const [recipientType, setRecipientType] = useState<'all' | 'customers' | 'vendors' | 'all_vendors' | 'specific_vendor_type' | 'specific_vendor'>('all');
  const [vendorType, setVendorType] = useState<'hotel' | 'store' | 'pharmacy' | 'bus'>('hotel');
  const [specificVendor, setSpecificVendor] = useState('');
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; type: string }>>([]);
  
  // Recipient count
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    if (recipientType === 'specific_vendor' && vendors.length === 0) {
      fetchVendors();
    }
  }, [recipientType]);

  useEffect(() => {
    // Fetch recipient count
    fetchRecipientCount();
  }, [recipientType, vendorType]);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors');
      if (response.ok) {
        const data = await response.json();
        // Transform vendors to match expected format with id field
        const transformedVendors = (data.vendors || []).map((vendor: any) => ({
          id: vendor._id || vendor.id,
          name: vendor.businessName || `${vendor.firstName} ${vendor.lastName}`.trim(),
          type: vendor.serviceType || 'general'
        }));
        setVendors(transformedVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchRecipientCount = async () => {
    try {
      const params = new URLSearchParams();
      if (recipientType === 'all_vendors') {
        params.append('type', 'vendors');
      } else if (recipientType === 'specific_vendor_type') {
        params.append('type', 'vendors');
        params.append('vendorType', vendorType);
      } else if (recipientType === 'specific_vendor') {
        params.append('type', 'vendor');
        params.append('vendorId', specificVendor);
      } else {
        params.append('type', recipientType);
      }

      const response = await fetch(`/api/admin/promotions/count?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRecipientCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching recipient count:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/promotions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          recipientType,
          vendorType: recipientType === 'specific_vendor_type' ? vendorType : undefined,
          vendorId: recipientType === 'specific_vendor' ? specificVendor : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setSubject('');
        setMessage('');
        setRecipientType('all');
      } else {
        setError(data.error || 'Failed to send promotions');
      }
    } catch (error) {
      console.error('Error sending promotions:', error);
      setError('Failed to send promotions');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-8 w-8 text-blue-600" />
          Email Promotions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send promotional emails to selected users
        </p>
      </div>

      {success && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <p className="text-green-700 dark:text-green-400">
              ✅ Promotional email sent successfully!
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSend}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Compose your promotional email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={10}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose who receives this email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={recipientType}
                onValueChange={(value) => setRecipientType(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Users
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customers" id="customers" />
                  <Label htmlFor="customers" className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Customers Only
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_vendors" id="all_vendors" />
                  <Label htmlFor="all_vendors" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    All Vendors
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific_vendor_type" id="specific_vendor_type" />
                  <Label htmlFor="specific_vendor_type" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Specific Vendor Type
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific_vendor" id="specific_vendor" />
                  <Label htmlFor="specific_vendor" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Specific Vendor
                  </Label>
                </div>
              </RadioGroup>

              {/* Specific vendor type selection */}
              {recipientType === 'specific_vendor_type' && (
                <div>
                  <Label htmlFor="vendorType">Vendor Type</Label>
                  <Select value={vendorType} onValueChange={(value) => setVendorType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">
                        <span className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          Hotels
                        </span>
                      </SelectItem>
                      <SelectItem value="store">
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Stores
                        </span>
                      </SelectItem>
                      <SelectItem value="pharmacy">
                        <span className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Pharmacies
                        </span>
                      </SelectItem>
                      <SelectItem value="bus">
                        <span className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          Bus Companies
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Specific vendor selection */}
              {recipientType === 'specific_vendor' && (
                <div>
                  <Label htmlFor="specificVendor">Select Vendor</Label>
                  <Select value={specificVendor} onValueChange={(value) => setSpecificVendor(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {`${vendor.name} - ${vendor.type}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Recipient count display */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Will send to:
                  </span>
                  <Badge variant="secondary" className="text-lg">
                    {recipientCount} recipients
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Button */}
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={sending || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

