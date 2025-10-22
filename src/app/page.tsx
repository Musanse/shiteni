'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DemoModeBanner } from '@/components/ui/demo-mode-banner';
import { 
  CreditCard, 
  Shield, 
  ArrowRight,
  ShoppingCart,
  Mail,
  Package,
  Search,
  Heart,
  Eye,
  Truck,
  Clock,
  Star,
  Building2,
  Bus
} from 'lucide-react';
import Image from 'next/image';

interface StatsData {
  totalBusinesses: {
    value: string;
    raw: number;
    label: string;
  };
  totalUsers: {
    value: string;
    raw: number;
    label: string;
  };
  totalBookings: {
    value: string;
    raw: number;
    label: string;
  };
  uptime: {
    value: string;
    raw: number;
    label: string;
  };
}

interface Product {
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
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [pharmacyProducts, setPharmacyProducts] = useState<Product[]>([]);
  const [pharmacyProductsLoading, setPharmacyProductsLoading] = useState(true);
  const [pharmacyProductsError, setPharmacyProductsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store' | 'pharmacy'>('store');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactForm, setContactForm] = useState({
    message: ''
  });
  const [showMessageSuccess, setShowMessageSuccess] = useState(false);
  const [showMessageError, setShowMessageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if we're in demo mode by trying to fetch from the API
    fetch('/api/auth/session')
      .then(res => res.json())
      .catch(() => {
        setIsDemoMode(true);
      });
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
    // Fetch real-time stats
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.success && data.stats) {
          setStats(data.stats);
          if (data.message) {
            console.log('Stats loaded with message:', data.message);
          } else {
            console.log('Real-time stats loaded:', data.stats);
          }
        } else {
          setStatsError(data.error || 'Failed to load stats');
          console.error('Stats API error:', data.error);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsError('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch store products
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          search: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : '',
          sort: sortBy
        });
        
        const response = await fetch(`/api/store/products?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.products || []);
          setTotalPages(data.totalPages || 1);
        } else {
          setProductsError(data.error || 'Failed to load products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsError('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    // Fetch pharmacy products
    const fetchPharmacyProducts = async () => {
      try {
        setPharmacyProductsLoading(true);
        setPharmacyProductsError(null);
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          search: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : '',
          sort: sortBy
        });
        
        const response = await fetch(`/api/pharmacy/products?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setPharmacyProducts(data.products || []);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setPharmacyProductsError(data.error || 'Failed to load pharmacy products');
        }
      } catch (error) {
        console.error('Error fetching pharmacy products:', error);
        setPharmacyProductsError('Failed to load pharmacy products');
      } finally {
        setPharmacyProductsLoading(false);
      }
    };


    if (activeTab === 'store') {
      fetchProducts();
    } else if (activeTab === 'pharmacy') {
      fetchPharmacyProducts();
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy, activeTab]);

  // Cart functions
  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      let newCart;
      if (existingItem) {
        newCart = prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const contactSupplier = (product: Product) => {
    // If user is not authenticated, redirect to login
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setSelectedProduct(product);
    
    // Pre-fill form with authenticated user details
    setContactForm({
      message: `Hi, I'm interested in "${product.name}". Could you please provide more information about this product?`
    });
    
    setShowContactModal(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.message.trim()) {
      setErrorMessage('Please enter a message');
      setShowMessageError(true);
      return;
    }

    try {
      // Determine service type based on product category or other logic
      // For now, we'll use a simple mapping
      const serviceType = selectedProduct?.category?.toLowerCase().includes('medicine') ? 'pharmacy' : 'store';
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: selectedProduct?.vendorId?._id,
          serviceType: serviceType,
          content: contactForm.message,
          productName: selectedProduct?.name
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

  // Removed automatic redirect to dashboard - users can now stay on home page
  // useEffect(() => {
  //   if (session) {
  //     router.push('/dashboard');
  //   }
  // }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <DemoModeBanner />
      )}
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image 
                src="/uploads/image/shiteni%20logo%20(1).png" 
                alt="Shiteni" 
                width={80}
                height={21}
                className="h-5 w-auto"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
              <h1 className="text-2xl font-bold text-foreground">Shiteni</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {/* Cart Basket */}
              {getCartItemCount() > 0 && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/customer/cart')}
                  className="relative flex items-center gap-2 px-4 py-2 border-2 border-amber-800 rounded-lg hover:border-amber-900 bg-amber-900 hover:bg-amber-800 text-white transition-all duration-200"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-white" />
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getCartItemCount()}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {getCartItemCount()} items
                  </span>
                  <span className="text-sm font-bold text-white">
                    ZMW {getCartTotal().toFixed(2)}
                  </span>
                </Button>
              )}
              {session ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome back, {(session.user as { firstName?: string })?.firstName || 'User'}!
                  </span>
                  <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="py-20 px-6 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/uploads/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto text-center relative">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Build Your <span className="text-primary">E-commerce</span> Empire
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Shiteni is the ultimate e-commerce platform that transforms your business into a digital marketplace. 
            Create stunning online stores, manage inventory, process orders, and grow your sales with our powerful tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store">
              <Button size="lg" className="flex items-center gap-2">
                Browse Store <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pharmacy">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Browse Pharmacy
              </Button>
            </Link>
            <Link href="/hotel">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Browse Hotels
              </Button>
            </Link>
            <Link href="/bus">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Browse Buses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Discover amazing products from verified suppliers worldwide
            </p>
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-muted rounded-lg p-1 flex-wrap gap-1">
                <button
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeTab === 'store'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('store')}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Store
                  </div>
                </button>
                <button
                  className={`px-4 py-2 rounded-md transition-all text-sm ${
                    activeTab === 'pharmacy'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('pharmacy')}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Pharmacy
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="mb-8 bg-card p-6 rounded-lg shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 items-center">
                <select
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {activeTab === 'store' ? (
                    <>
                      <option value="all">All Categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Garden</option>
                      <option value="health">Health & Beauty</option>
                      <option value="sports">Sports</option>
                      <option value="automotive">Automotive</option>
                    </>
                  ) : (
                    <>
                      <option value="all">All Categories</option>
                      <option value="prescription">Prescription Medicines</option>
                      <option value="over-the-counter">Over-the-Counter</option>
                      <option value="vitamins">Vitamins & Supplements</option>
                      <option value="medical-devices">Medical Devices</option>
                      <option value="personal-care">Personal Care</option>
                      <option value="baby-care">Baby Care</option>
                    </>
                  )}
                </select>
                
                <select
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
                
                {/* View toggle removed on landing */}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {(activeTab === 'store' ? productsLoading : pharmacyProductsLoading) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
              ))}
            </div>
          ) : (activeTab === 'store' ? productsError : pharmacyProductsError) ? (
            <div className="text-center py-12">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg inline-block">
                <p className="font-medium">Failed to load products</p>
                <p className="text-sm">{activeTab === 'store' ? productsError : pharmacyProductsError}</p>
              </div>
            </div>
          ) : (activeTab === 'store' ? products : pharmacyProducts).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : 'grid-cols-1'
              }`}>
                {(activeTab === 'store' ? products : pharmacyProducts).map((product) => (
                  <Card key={product._id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden relative">
                        {(product.images && product.images.length > 0) || product.imageUrl ? (
                          <Image
                            src={product.images?.[0] || product.imageUrl || ''}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            <div className="text-center">
                              <Package className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">No Image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {product.featured && (
                          <Badge variant="default" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        {product.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {activeTab === 'pharmacy' && product.prescriptionRequired && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Prescription Required
                          </Badge>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <Badge variant="destructive" className="text-xs">
                            Sale
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(product.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            ZMW {product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ZMW {product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {product.supplierLocation}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {activeTab === 'pharmacy' ? (
                              <>
                                Stock: {product.stock} units
                                {product.expiryDate && (
                                  <span className="ml-2">
                                    • Expires: {new Date(product.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </>
                            ) : (
                              `Min Order: ${product.minOrderQuantity}`
                            )}
                          </div>
                          {activeTab === 'pharmacy' && product.genericName && (
                            <div className="text-xs text-blue-600 mt-1">
                              Generic: {product.genericName}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2 pt-2">
                          <Button 
                            size="sm" 
                            className="w-full bg-amber-900 hover:bg-amber-800 text-white"
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {activeTab === 'pharmacy' ? 'Order Medicine' : 'Add to Cart'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full bg-black hover:bg-gray-800 text-white border-black"
                            onClick={() => contactSupplier(product)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Contact Supplier
                          </Button>
                        </div>
                      </div>
              </CardContent>
            </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
          </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Live Statistics</h2>
            <p className="text-muted-foreground">
              Real-time data from our platform
            </p>
          </div>
          
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div className="text-center">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg inline-block">
                <p className="font-medium">Failed to load statistics</p>
                <p className="text-sm">{statsError}</p>
              </div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-4xl font-bold text-primary mb-2 group-hover:text-primary/80">
                  {stats.totalBusinesses.value}
                </div>
                <div className="text-muted-foreground">{stats.totalBusinesses.label}</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-4xl font-bold text-secondary mb-2 group-hover:text-secondary/80">
                  {stats.totalUsers.value}
                </div>
                <div className="text-muted-foreground">{stats.totalUsers.label}</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-4xl font-bold text-accent mb-2 group-hover:text-accent/80">
                  {stats.totalBookings.value}
                </div>
                <div className="text-muted-foreground">{stats.totalBookings.label}</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-4xl font-bold text-primary mb-2 group-hover:text-primary/80">
                  {stats.uptime.value}
                </div>
                <div className="text-muted-foreground">{stats.uptime.label}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$50M+</div>
                <div className="text-muted-foreground">Sales Processed</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-secondary mb-2">10K+</div>
                <div className="text-muted-foreground">Active Stores</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">1M+</div>
                <div className="text-muted-foreground">Orders Fulfilled</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
            </div>
          )}
          
        </div>
      </section>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-green-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Shopping Cart ({getCartItemCount()} items)</h2>
              <Button variant="ghost" onClick={() => setShowCart(false)} className="text-white hover:bg-green-700">
                ×
              </Button>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-green-200 mx-auto mb-4" />
                <p className="text-green-200">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 p-3 border border-green-600 rounded-lg bg-green-700">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      <p className="text-sm text-green-200">Qty: {item.quantity || 1}</p>
                      <p className="text-sm font-medium text-white">ZMW {(item.price * (item.quantity || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-green-600 pt-4">
                  <div className="flex items-center justify-between text-lg font-bold text-white">
                    <span>Total:</span>
                    <span>ZMW {getCartTotal().toFixed(2)}</span>
                  </div>
                  <Button className="w-full mt-4 bg-amber-900 hover:bg-amber-800 text-white" size="lg">
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-card py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Shiteni</span>
          </div>
          <p className="text-muted-foreground mb-4">
            The ultimate e-commerce platform for building and scaling your online business
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 Shiteni. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Contact Supplier</CardTitle>
              <CardDescription>
                Get in touch about &quot;{selectedProduct.name}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="Enter your message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowContactModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Send Message
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
                The vendor will respond to your inbox. You can check your messages in the customer dashboard.
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