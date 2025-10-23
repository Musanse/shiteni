'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id?: string;
  _id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
  vendor?: {
    name: string;
    email: string;
    serviceType: string;
  };
  vendorId?: {
    _id: string;
    email: string;
    businessName: string;
    serviceType: string;
  };
  category?: string;
  prescriptionRequired?: boolean;
}

export default function CustomerCartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showOrderError, setShowOrderError] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState('');

  // Load cart from localStorage
  useEffect(() => {
    if (status === 'loading') return;
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, [status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item);
      return;
    }
    
    const updatedCart = cart.map(cartItem => {
      const itemId = item.id || item._id || item.productId;
      const cartItemId = cartItem.id || cartItem._id || cartItem.productId;
      
      if (cartItemId === itemId) {
        return { ...cartItem, quantity: newQuantity };
      }
      return cartItem;
    });
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (item: CartItem) => {
    const itemId = item.id || item._id || item.productId;
    const updatedCart = cart.filter(cartItem => {
      const cartItemId = cartItem.id || cartItem._id || cartItem.productId;
      return cartItemId !== itemId;
    });
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const formatCurrency = (amount: number, currency: string = 'ZMW') => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    setProcessing(true);
    
    try {
      // Create a single customer order with all items
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id || item._id || item.productId || '',
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          paymentMethod: 'cash'
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to place order' }));
        throw new Error(err.error || 'Failed to place order');
      }

      // Clear cart after successful order
      setCart([]);
      localStorage.removeItem('cart');

      // Success: show modal and redirect to order history
      setShowOrderSuccess(true);
      router.push('/dashboard/customer/purchase');

    } catch (error) {
      console.error('Error placing orders:', error);
      setOrderErrorMessage(error instanceof Error ? error.message : 'Failed to place orders');
      setShowOrderError(true);
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
              </div>
              <Link href="/dashboard/customer/purchase">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Add some products to your cart to get started
            </p>
            <Link href="/dashboard/customer/purchase">
              <Button size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
                <Badge variant="secondary">{getCartItemCount()} items</Badge>
              </div>
              <Link href="/dashboard/customer/purchase">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart Items ({getCartItemCount()})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => {
                    const itemId = item.id || item._id || item.productId;
                    const itemImage = item.image || item.images?.[0] || '/placeholder-product.jpg';
                    const vendorName = item.vendor?.name || item.vendorId?.businessName || 'Unknown Vendor';
                    const serviceType = item.vendor?.serviceType || item.vendorId?.serviceType || 'Unknown';
                    
                    return (
                      <div key={itemId} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {vendorName} • {serviceType}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => {
                      const itemId = item.id || item._id || item.productId;
                      return (
                        <div key={itemId} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(getCartTotal())}</span>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={processing || cart.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    Orders will be sent to each vendor separately
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{session.user.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vendors will contact you directly for delivery details
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-700">Order Placed Successfully</DialogTitle>
            <DialogDescription>
              Redirecting to your order history...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button onClick={() => router.push('/dashboard/customer/purchase')}>View Orders</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderError} onOpenChange={setShowOrderError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Order Failed</DialogTitle>
            <DialogDescription>
              {orderErrorMessage || 'We could not place your order. Please try again.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOrderError(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
