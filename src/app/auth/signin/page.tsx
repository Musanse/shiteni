'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // Check for success message from URL params
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(decodeURIComponent(message));
    }
  }, [searchParams]);
  
  // Check if user is already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as { role?: string })?.role;
      const serviceType = (session.user as { serviceType?: string })?.serviceType;
      let redirectPath = '/dashboard'; // Default - let middleware handle routing
      
      if (userRole === 'institution' || userRole === 'staff') {
        redirectPath = '/dashboard/institution';
      } else if (userRole === 'customer') {
        redirectPath = '/dashboard/customer';
      } else if (userRole === 'manager') {
        // For vendors, check their service type
        if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
          redirectPath = `/dashboard/vendor/${serviceType}`;
        } else {
          redirectPath = '/dashboard/customer';
        }
      } else if (userRole === 'admin') {
        // Check if this is a store admin or system admin
        if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
          redirectPath = `/dashboard/vendor/${serviceType}`;
        } else {
          redirectPath = '/dashboard/admin';
        }
      } else if (userRole && ['cashier', 'inventory_manager', 'sales_associate'].includes(userRole)) {
        // For store staff, check their service type
        if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
          redirectPath = `/dashboard/vendor/${serviceType}`;
        } else {
          redirectPath = '/dashboard/customer';
        }
      } else if (userRole && ['receptionist', 'housekeeping'].includes(userRole)) {
        // For hotel staff, check their service type
        if (serviceType && serviceType === 'hotel') {
          redirectPath = `/dashboard/vendor/hotel`;
        } else {
          redirectPath = '/dashboard/customer';
        }
      } else if (userRole && ['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance'].includes(userRole)) {
        // For bus staff, check their service type
        if (serviceType && serviceType === 'bus') {
          redirectPath = `/dashboard/vendor/bus`;
        } else {
          redirectPath = '/dashboard/customer';
        }
      }
      
      console.log('🔀 User already authenticated, redirecting to:', redirectPath);
      router.replace(redirectPath);
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Get callback URL from search params or use default
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      console.log('🔀 Sign-in callback URL:', callbackUrl);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl
      });

      if (result?.error) {
        // Check if it's an email verification issue
        if (result.error.includes('unverified') || result.error.includes('verification')) {
          setErrorMessage('Please verify your email address before signing in. Check your inbox for the verification email.');
        } else {
          setErrorMessage('Invalid credentials');
        }
      } else {
        // Success message
        setSuccessMessage('Login successful! Redirecting...');
        
        // Use NextAuth's built-in redirect mechanism
        setTimeout(() => {
          // Use the callback URL from search params or default
          const redirectPath = searchParams.get('callbackUrl') || '/dashboard';
          
          // Check if redirectPath is already a full URL
          if (redirectPath.startsWith('http')) {
            window.location.href = redirectPath;
          } else {
            // Handle production vs development URLs
            const isProduction = process.env.NODE_ENV === 'production';
            const baseUrl = isProduction ? window.location.origin : 'http://localhost:3000';
            
            // Force a page reload to ensure session is established
            const redirectUrl = `${baseUrl}${redirectPath}`;
            console.log('🔀 Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Bush Green Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-green-200 to-green-300">
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-green-500 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-green-600 rounded-full opacity-30 animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-green-700 rounded-full opacity-30 animate-pulse delay-500"></div>
      </div>
      
      {/* Home Button */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
          onClick={(e) => {
            console.log('Home button clicked - navigating to landing page');
            console.log('Button element:', e.currentTarget);
            console.log('Event:', e);
            // Force navigation using window.location for reliability
            window.location.href = '/';
          }}
          onMouseDown={() => {
            console.log('Home button mouse down');
          }}
          onMouseUp={() => {
            console.log('Home button mouse up');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              console.log('Home button activated via keyboard - navigating to landing page');
              window.location.href = '/';
            }
          }}
          aria-label="Navigate to home page"
          type="button"
          style={{ pointerEvents: 'auto', zIndex: 9999 }}
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </button>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Shiteni
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your fintech dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-green-700 hover:text-green-800 transition-colors duration-200">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link href="/auth/forgot-password" className="font-medium text-green-700 hover:text-green-800 transition-colors duration-200">
                Forgot your password?
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
