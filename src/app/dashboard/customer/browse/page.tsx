'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Users,
  Building2,
  Bus,
  ShoppingBag,
  Pill,
  Plus,
  Minus,
  Eye,
  Mail
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  vendorType: 'hotel' | 'bus' | 'store' | 'pharmacy';
  vendorName: string;
  vendorId: string;
  images: string[];
  rating: number;
  reviewCount: number;
  availability: 'available' | 'limited' | 'out_of_stock';
  tags: string[];
  location: {
    city: string;
    district: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerPurchasePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('Cart state changed:', cart);
    console.log('Cart item count:', getCartItemCount());
  }, [cart]);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch('/api/customer/products');
      const data = await response.json();
      
      console.log('Products API response:', data);
      
      if (data.success) {
        console.log('Products loaded:', data.products.length);
        setProducts(data.products);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesVendor = vendorFilter === 'all' || product.vendorType === vendorFilter;
    
    let matchesPrice = true;
    if (priceRange !== 'all') {
      const price = product.price;
      switch (priceRange) {
        case 'under-100':
          matchesPrice = price < 100;
          break;
        case '100-500':
          matchesPrice = price >= 100 && price <= 500;
          break;
        case '500-1000':
          matchesPrice = price >= 500 && price <= 1000;
          break;
        case 'over-1000':
          matchesPrice = price > 1000;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesVendor && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getVendorIcon = (vendorType: string) => {
    switch (vendorType) {
      case 'hotel': return <Building2 className="h-4 w-4" />;
      case 'bus': return <Bus className="h-4 w-4" />;
      case 'store': return <ShoppingBag className="h-4 w-4" />;
      case 'pharmacy': return <Pill className="h-4 w-4" />;
      default: return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getVendorColor = (vendorType: string) => {
    switch (vendorType) {
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'bus': return 'bg-green-100 text-green-800';
      case 'store': return 'bg-purple-100 text-purple-800';
      case 'pharmacy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addToCart = (product: Product) => {
    console.log('Adding to cart:', product.name);
    console.log('Current cart before update:', cart);
    
    setCart(prev => {
      console.log('Previous cart state:', prev);
      const existingItem = prev.find(item => item.product._id === product._id);
      console.log('Existing item found:', existingItem);
      
      if (existingItem) {
        const newCart = prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        console.log('Updated existing item, new cart:', newCart);
        return newCart;
      } else {
        const newCart = [...prev, { product, quantity: 1 }];
        console.log('Added new item, new cart:', newCart);
        return newCart;
      }
    });
    
    // Show notification
    setShowCartNotification(true);
    setTimeout(() => setShowCartNotification(false), 3000);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleEmailProduct = (product: Product) => {
    console.log('Emailing product:', product.name);
    alert(`Opening email for ${product.name}`);
    const subject = `Inquiry about ${product.name}`;
    const body = `Hi,\n\nI'm interested in learning more about "${product.name}" from ${product.vendorName}.\n\nProduct Details:\n- Name: ${product.name}\n- Description: ${product.description}\n- Price: ${formatCurrency(product.price, product.currency)}\n- Vendor: ${product.vendorName}\n- Location: ${product.location.city}, ${product.location.district}\n\nPlease provide more information about this product.\n\nThank you!`;
    
    const mailtoLink = `mailto:${product.vendorName.toLowerCase().replace(/\s+/g, '')}@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    console.log('Opening mailto link:', mailtoLink);
    window.open(mailtoLink, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
          <p className="text-gray-600 mt-2">Discover and shop products from local vendors</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cart Basket */}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/customer/cart')}
            className="relative flex items-center gap-2 px-4 py-2 border-2 border-amber-800 rounded-lg hover:border-amber-900 bg-amber-900 hover:bg-amber-800 text-white transition-all duration-200"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-white" />
              {getCartItemCount() > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getCartItemCount()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white">
              {getCartItemCount() > 0 ? `${getCartItemCount()} items` : 'Cart'}
            </span>
            {getCartItemCount() > 0 && (
              <span className="text-sm font-bold text-white">
                {formatCurrency(getCartTotal(), 'ZMW')}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="food">Food & Beverages</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor Type</label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectItem value="hotel">Hotels</SelectItem>
                  <SelectItem value="bus">Bus Services</SelectItem>
                  <SelectItem value="store">Stores</SelectItem>
                  <SelectItem value="pharmacy">Pharmacies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-100">Under ZMW 100</SelectItem>
                  <SelectItem value="100-500">ZMW 100 - 500</SelectItem>
                  <SelectItem value="500-1000">ZMW 500 - 1,000</SelectItem>
                  <SelectItem value="over-1000">Over ZMW 1,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' || vendorFilter !== 'all' || priceRange !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No products are available at the moment.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          sortedProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getVendorColor(product.vendorType)}>
                    <span className="mr-1">{getVendorIcon(product.vendorType)}</span>
                    {product.vendorType.charAt(0).toUpperCase() + product.vendorType.slice(1)}
                  </Badge>
                  <Badge className={getAvailabilityColor(product.availability)}>
                    {product.availability.replace('_', ' ')}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {product.rating.toFixed(1)} ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{product.location.city}, {product.location.district}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{product.vendorName}</span>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addToCart(product)}
                        disabled={product.availability === 'out_of_stock'}
                        className="flex-1 bg-amber-900 hover:bg-amber-800 text-white rounded-lg"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEmailProduct(product)}
                        className="bg-black hover:bg-gray-800 text-white border-black rounded-lg w-10 h-10 p-0"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">Item added to cart!</span>
        </div>
      )}

      {/* Floating Cart Basket */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setShowCart(true)}
            className="w-16 h-16 rounded-full bg-amber-900 hover:bg-amber-800 text-white shadow-lg flex items-center justify-center relative"
          >
            <ShoppingCart className="h-6 w-6" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {getCartItemCount()}
            </div>
          </Button>
        </div>
      )}

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-green-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <div key={item.product._id} className="flex items-center gap-4 p-4 border border-green-600 rounded-lg bg-green-700">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.product.name}</h4>
                      <p className="text-sm text-green-200">{item.product.vendorName}</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(item.product.price, item.product.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="border-green-400 text-green-200 hover:bg-green-600"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-white">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="border-green-400 text-green-200 hover:bg-green-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">
                        {formatCurrency(item.product.price * item.quantity, item.product.currency)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-300 hover:bg-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-green-600 pt-4">
                  <div className="flex items-center justify-between text-lg font-bold text-white">
                    <span>Total:</span>
                    <span>{formatCurrency(getCartTotal(), 'ZMW')}</span>
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
    </div>
  );
}
