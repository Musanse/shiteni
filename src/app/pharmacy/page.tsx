'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Heart,
  Phone,
  Mail,
  Pill,
  Shield,
  AlertTriangle,
  Calendar,
  FileText
} from 'lucide-react';

interface PharmacyMedicine {
  _id: string;
  vendorId: {
    _id: string;
    email: string;
    businessName: string;
    serviceType: string;
  };
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  imageUrl?: string;
  stock: number;
  category: string;
  rating: number;
  reviewCount: number;
  supplier: string;
  supplierLocation: string;
  minOrderQuantity: number;
  isVerified: boolean;
  tags: string[];
  featured: boolean;
  // Pharmacy-specific fields
  genericName?: string;
  manufacturer?: string;
  dosage?: string;
  form?: string;
  strength?: string;
  expiryDate?: string;
  prescriptionRequired?: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  prescriptionRequired: boolean;
}

export default function PharmacyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<PharmacyMedicine | null>(null);
  const [contactForm, setContactForm] = useState({
    message: ''
  });
  const [showMessageSuccess, setShowMessageSuccess] = useState(false);
  const [showMessageError, setShowMessageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.message.trim()) {
      setErrorMessage('Please enter a message');
      setShowMessageError(true);
      return;
    }

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: selectedMedicine?.vendorId?._id,
          serviceType: 'pharmacy',
          content: contactForm.message,
          productName: selectedMedicine?.name
        }),
      });

      if (response.ok) {
        setShowContactModal(false);
        setShowMessageSuccess(true);
        setContactForm({ message: '' });
      } else {
        const error = await response.json();
        setErrorMessage(`Failed to send message: ${error.error}`);
        setShowMessageError(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Failed to send message. Please try again.');
      setShowMessageError(true);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchTerm, selectedCategory, prescriptionFilter, sortBy]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/pharmacy/products');
      const data = await response.json();
      if (data.success) {
        setMedicines(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (medicine.genericName && medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(medicine => medicine.category === selectedCategory);
    }

    // Filter by prescription requirement
    if (prescriptionFilter !== 'all') {
      const requiresPrescription = prescriptionFilter === 'required';
      filtered = filtered.filter(medicine => medicine.prescriptionRequired === requiresPrescription);
    }

    // Sort medicines
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return 0; // We don't have createdAt in the new structure
        default:
          return 0;
      }
    });

    setFilteredMedicines(filtered);
  };

  const addToCart = (medicine: PharmacyMedicine) => {
    if (medicine.prescriptionRequired) {
      alert('This medicine requires a prescription. Please contact our pharmacist.');
      return;
    }

    const existingItem = cart.find(item => item.productId === medicine._id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item =>
        item.productId === medicine._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, {
        productId: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: 1,
        image: medicine.images[0],
        prescriptionRequired: medicine.prescriptionRequired,
        vendor: medicine.vendorId
      }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const contactSupplier = (medicine: PharmacyMedicine) => {
    // If user is not authenticated, redirect to login
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setSelectedMedicine(medicine);
    
    // Pre-fill form with authenticated user details
    setContactForm({
      message: `Hi, I'm interested in "${medicine.name}". Could you please provide more information about this medicine?`
    });
    
    setShowContactModal(true);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const categories = ['all', ...Array.from(new Set(medicines.map(m => m.category)))];

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    return expiry <= sixMonthsFromNow;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pill className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Shiteni Pharmacy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="relative"
                onClick={() => router.push('/dashboard/customer/cart')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({getCartItemCount()})
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="py-6 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={prescriptionFilter}
                onChange={(e) => setPrescriptionFilter(e.target.value)}
                className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Medicines</option>
                <option value="required">Prescription Required</option>
                <option value="not-required">No Prescription</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredMedicines.length} medicines found
            </div>
          </div>
        </div>
      </section>

      {/* Medicines Grid */}
      <section className="py-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedicines.map((medicine) => (
              <Card key={medicine._id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-4">
                  <div className="relative">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                      {(medicine.images && medicine.images.length > 0) || medicine.imageUrl ? (
                        <img
                          src={medicine.images?.[0] || medicine.imageUrl || ''}
                          alt={medicine.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Pill className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    {medicine.prescriptionRequired && (
                      <Badge className="absolute top-2 left-2 bg-orange-500">
                        <FileText className="h-3 w-3 mr-1" />
                        Rx Required
                      </Badge>
                    )}
                    {medicine.isVerified && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {medicine.expiryDate && isExpiringSoon(medicine.expiryDate) && (
                      <Badge className="absolute bottom-2 left-2 bg-yellow-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{medicine.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {medicine.genericName && medicine.strength ? 
                      `${medicine.genericName} • ${medicine.strength}` : 
                      medicine.description
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ZMW {medicine.price.toFixed(2)}
                      </span>
                      <Badge variant="outline">{medicine.category}</Badge>
                    </div>
                    
                    {medicine.form && medicine.dosage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Pill className="h-4 w-4" />
                        <span>{medicine.form} • {medicine.dosage}</span>
                      </div>
                    )}
                    
                    {medicine.expiryDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Expires: {new Date(medicine.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>{medicine.stock} in stock</span>
                    </div>

                    {medicine.stock <= 10 && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Low Stock
                      </Badge>
                    )}

                    <div className="space-y-2">
                      <Button
                        onClick={() => addToCart(medicine)}
                        className="w-full"
                        disabled={medicine.stock === 0 || medicine.prescriptionRequired}
                        variant={medicine.prescriptionRequired ? "outline" : "default"}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {medicine.prescriptionRequired ? 'Rx Required' : 'Add to Cart'}
                      </Button>
                      <Button
                        onClick={() => contactSupplier(medicine)}
                        variant="outline"
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Pharmacist
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No medicines found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Supplier Modal */}
      {showContactModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Contact Pharmacist</CardTitle>
              <CardDescription>
                Get in touch about "{selectedMedicine.name}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    placeholder="Tell us about your medication needs..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Send Message
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Success Modal */}
      {showMessageSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-green-600">Message Sent!</CardTitle>
              <CardDescription>
                Your message has been delivered successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                The pharmacist will respond to your inbox. You can check your messages in the customer dashboard.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowMessageSuccess(false)} 
                  className="flex-1"
                >
                  OK
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowMessageSuccess(false);
                    router.push('/dashboard/customer/inbox');
                  }}
                  className="flex-1"
                >
                  View Inbox
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Error Modal */}
      {showMessageError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">Message Failed</CardTitle>
              <CardDescription>
                Unable to send your message
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowMessageError(false)} 
                  className="flex-1"
                >
                  OK
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowMessageError(false);
                    setShowContactModal(true);
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
