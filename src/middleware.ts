import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  async function middleware(request: NextRequest, { token }) {
    const path = request.nextUrl.pathname;

    console.log('🔒 Auth Middleware');
    console.log('Path:', path);
    console.log('Role:', token?.role);

    // Allow public paths, API routes, and static files
    if (
      path === '/' || 
      path.startsWith('/auth/') || 
      path.startsWith('/api/') ||
      path === '/reset-password' ||
      path === '/verify-email' ||
      path === '/forgot-password' ||
      path === '/favicon.ico' ||
      path === '/sw.js' ||
      path.startsWith('/icons/') ||
      path.startsWith('/uploads/')
    ) {
      console.log('✅ Public path, allowing access');
      return NextResponse.next();
    }

    // Require authentication for all other routes
    if (!token) {
      console.log('❌ No token, redirecting to signin');
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Handle dashboard routes
    if (path.startsWith('/dashboard')) {
      const role = token.role as string;
      const serviceType = (token as any).serviceType;
      console.log('🔍 Middleware - Role:', role, 'ServiceType:', serviceType, 'Path:', path);

      // Default dashboard redirect
      if (path === '/dashboard') {
        let redirectPath = '/dashboard/customer'; // Default fallback
        
        if (role === 'super_admin') {
          redirectPath = '/dashboard/admin';
        } else if (role === 'admin') {
          // Check if this is a store admin or system admin
          const serviceType = (token as any).serviceType;
          if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
            redirectPath = `/dashboard/vendor/${serviceType}`;
            console.log('✅ Redirecting store admin to service-specific dashboard:', redirectPath);
          } else {
            redirectPath = '/dashboard/admin';
            console.log('✅ Redirecting system admin to admin dashboard');
          }
        } else if (role === 'manager') {
          // For vendors, check their service type
          const serviceType = (token as any).serviceType;
          if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
            redirectPath = `/dashboard/vendor/${serviceType}`;
            console.log('✅ Redirecting to service-specific dashboard:', redirectPath);
          } else {
            // If no serviceType, redirect to signup to complete profile
            redirectPath = '/auth/signup?error=service_type_required';
            console.log('⚠️ ServiceType not found, redirecting to signup');
          }
        } else if (['cashier', 'inventory_manager', 'sales_associate'].includes(role)) {
          // For store staff, check their service type
          const serviceType = (token as any).serviceType;
          if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
            redirectPath = `/dashboard/vendor/${serviceType}`;
            console.log('✅ Redirecting store staff to service-specific dashboard:', redirectPath);
          } else {
            // If no serviceType, redirect to signup to complete profile
            redirectPath = '/auth/signup?error=service_type_required';
            console.log('⚠️ ServiceType not found for store staff, redirecting to signup');
          }
        } else if (['receptionist', 'housekeeping'].includes(role)) {
          // For hotel staff, check their service type
          const serviceType = (token as any).serviceType;
          if (serviceType && serviceType === 'hotel') {
            redirectPath = `/dashboard/vendor/hotel`;
            console.log('✅ Redirecting hotel staff to hotel dashboard:', redirectPath);
          } else {
            // If no serviceType, redirect to signup to complete profile
            redirectPath = '/auth/signup?error=service_type_required';
            console.log('⚠️ ServiceType not found for hotel staff, redirecting to signup');
          }
        } else if (['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance'].includes(role)) {
          // For bus staff, check their service type
          const serviceType = (token as any).serviceType;
          if (serviceType && serviceType === 'bus') {
            redirectPath = `/dashboard/vendor/bus`;
            console.log('✅ Redirecting bus staff to bus dashboard:', redirectPath);
          } else {
            // If no serviceType, redirect to signup to complete profile
            redirectPath = '/auth/signup?error=service_type_required';
            console.log('⚠️ ServiceType not found for bus staff, redirecting to signup');
          }
        } else if (['pharmacist', 'technician', 'pharmacy_cashier'].includes(role)) {
          // For pharmacy staff, check their service type
          const serviceType = (token as any).serviceType;
          if (serviceType && serviceType === 'pharmacy') {
            redirectPath = `/dashboard/vendor/pharmacy`;
            console.log('✅ Redirecting pharmacy staff to pharmacy dashboard:', redirectPath);
          } else {
            // If no serviceType, redirect to signup to complete profile
            redirectPath = '/auth/signup?error=service_type_required';
            console.log('⚠️ ServiceType not found for pharmacy staff, redirecting to signup');
          }
        } else if (role === 'customer') {
          redirectPath = '/dashboard/customer';
        }
        
        console.log('🔄 Redirecting to role-specific dashboard:', redirectPath);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // Role-based access control
      if (path.startsWith('/dashboard/admin')) {
        // Only admin and super_admin can access admin routes
        if (role !== 'admin' && role !== 'super_admin') {
          console.log('⛔ Non-admin attempting to access admin route');
          // Redirect store staff to their vendor dashboard
          if (['manager', 'cashier', 'inventory_manager', 'sales_associate'].includes(role)) {
            const serviceType = (token as any).serviceType;
            if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
              return NextResponse.redirect(new URL(`/dashboard/vendor/${serviceType}`, request.url));
            }
          }
          return NextResponse.redirect(new URL('/dashboard/customer', request.url));
        }
      } else if (path.startsWith('/dashboard/customer')) {
        // Only customers can access customer routes
        if (role !== 'customer') {
          console.log('⛔ Non-customer attempting to access customer route');
          // Redirect store staff to their vendor dashboard
          if (['manager', 'cashier', 'inventory_manager', 'sales_associate'].includes(role)) {
            const serviceType = (token as any).serviceType;
            if (serviceType && ['hotel', 'store', 'pharmacy', 'bus'].includes(serviceType)) {
              return NextResponse.redirect(new URL(`/dashboard/vendor/${serviceType}`, request.url));
            }
          }
          // Redirect hotel staff to their vendor dashboard
          if (['receptionist', 'housekeeping'].includes(role)) {
            const serviceType = (token as any).serviceType;
            if (serviceType && serviceType === 'hotel') {
              return NextResponse.redirect(new URL(`/dashboard/vendor/hotel`, request.url));
            }
          }
          // Redirect bus staff to their vendor dashboard
          if (['driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance'].includes(role)) {
            const serviceType = (token as any).serviceType;
            if (serviceType && serviceType === 'bus') {
              return NextResponse.redirect(new URL(`/dashboard/vendor/bus`, request.url));
            }
          }
          // For system admins, redirect to admin dashboard
          if (role === 'admin' || role === 'super_admin') {
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          }
          return NextResponse.redirect(new URL('/dashboard/customer', request.url));
        }
      } else if (path.startsWith('/dashboard/vendor/')) {
        // Only managers (vendors) and staff can access vendor routes
        const allowedRoles = ['manager', 'cashier', 'inventory_manager', 'sales_associate', 'admin', 'receptionist', 'housekeeping', 'driver', 'conductor', 'ticket_seller', 'dispatcher', 'maintenance', 'pharmacist', 'technician', 'pharmacy_cashier'];
        if (!allowedRoles.includes(role)) {
          console.log('⛔ Non-vendor/staff attempting to access vendor route');
          return NextResponse.redirect(new URL('/dashboard/customer', request.url));
        }
        
        // Check if the service type matches the user's service type
        const pathServiceType = path.split('/')[3]; // Extract service type from /dashboard/vendor/{serviceType}
        const userServiceType = (token as any).serviceType;
        
        if (pathServiceType !== userServiceType) {
          console.log('⛔ Service type mismatch, redirecting to correct dashboard');
          // If user has no serviceType, redirect to appropriate dashboard based on role
          if (!userServiceType) {
            if (role === 'admin' || role === 'super_admin') {
              return NextResponse.redirect(new URL('/dashboard/admin', request.url));
            } else if (role === 'customer') {
              return NextResponse.redirect(new URL('/dashboard/customer', request.url));
            }
          }
          return NextResponse.redirect(new URL(`/dashboard/vendor/${userServiceType}`, request.url));
        }
      }
    }

    console.log('✅ Access granted');
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true; // We'll handle authorization in the middleware function
      },
    },
  }
);