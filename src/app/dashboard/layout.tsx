'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  Shield, 
  Users,
  Menu,
  X,
  Settings,
  LogOut,
  Bell,
  Search,
  BarChart3,
  UserCheck,
  Crown,
  Database,
  Mail,
  Calendar,
  Bed,
  MessageSquare,
  DollarSign,
  FileText,
  TrendingUp,
  Home,
  Package,
  ShoppingCart,
  Bus,
  MapPin,
  Clock,
  Ticket,
  Truck,
  Send,
  BarChart
} from 'lucide-react';
import { businessConfigs, BusinessType } from '@/types/business';
import { hasPermission, getAllowedModules, canAccessModule, getRoleDisplayName } from '@/lib/permissions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [allowedModules, setAllowedModules] = useState<string[]>([]);

  useEffect(() => {
    // Extract business type from pathname
    const pathParts = pathname.split('/');
    if (pathParts.length >= 4 && pathParts[1] === 'dashboard' && pathParts[2] === 'vendor') {
      const businessType = pathParts[3] as BusinessType;
      if (businessType in businessConfigs) {
        setCurrentBusiness(businessType);
      }
    }
    
    // Get user role and service type
    const role = (session?.user as any)?.role;
    const service = (session?.user as any)?.serviceType;
    setUserRole(role || '');
    setServiceType(service || '');
    
    // Check if user is admin
    setIsAdmin(['admin', 'super_admin'].includes(role));
    
    // Get allowed modules based on role and service type
    const modules = getAllowedModules(role, service);
    setAllowedModules(modules);
  }, [pathname, session]);

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const getBusinessIcon = (businessType: BusinessType) => {
    switch (businessType) {
      case 'hotel':
        return <Building2 className="h-5 w-5" />;
      case 'store':
        return <CreditCard className="h-5 w-5" />;
      case 'pharmacy':
        return <Shield className="h-5 w-5" />;
      case 'bus':
        return <Users className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getBusinessColor = (businessType: BusinessType) => {
    const config = businessConfigs[businessType];
    switch (config.color) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-secondary';
      case 'accent':
        return 'text-accent';
      default:
        return 'text-primary';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'bookings':
        return <Calendar className="h-4 w-4" />;
      case 'room-management':
        return <Bed className="h-4 w-4" />;
      case 'in-house':
        return <Users className="h-4 w-4" />;
      case 'staff':
      case 'staffs':
        return <UserCheck className="h-4 w-4" />;
      case 'customers':
        return <Users className="h-4 w-4" />;
      case 'payments':
        return <DollarSign className="h-4 w-4" />;
      case 'inbox':
        return <MessageSquare className="h-4 w-4" />;
      case 'analytics':
        return <TrendingUp className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      case 'subscription':
        return <CreditCard className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      case 'products':
        return <Package className="h-4 w-4" />;
      case 'orders':
        return <ShoppingCart className="h-4 w-4" />;
      case 'inventory':
        return <Database className="h-4 w-4" />;
      case 'medicines':
        return <Shield className="h-4 w-4" />;
      case 'patients':
        return <Users className="h-4 w-4" />;
      case 'insurance':
        return <CreditCard className="h-4 w-4" />;
      case 'compliance':
        return <Shield className="h-4 w-4" />;
      // Bus-specific modules
      case 'routes':
        return <Bus className="h-4 w-4" />;
      case 'stops':
        return <MapPin className="h-4 w-4" />;
      case 'fares':
        return <DollarSign className="h-4 w-4" />;
      case 'schedule-trip':
        return <Clock className="h-4 w-4" />;
      case 'fleet':
        return <Truck className="h-4 w-4" />;
      case 'passengers':
        return <Users className="h-4 w-4" />;
      case 'sending':
        return <Send className="h-4 w-4" />;
      case 'ticketing':
        return <Ticket className="h-4 w-4" />;
      default:
        return getBusinessIcon(currentBusiness!);
    }
  };

  const navigationItems = currentBusiness ? businessConfigs[currentBusiness].modules
    .filter(module => canAccessModule(userRole, module, serviceType))
    .map(module => ({
      name: module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, ' '),
      href: `/dashboard/vendor/${currentBusiness}/${module}`,
      icon: getModuleIcon(module)
    })) : [];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <div className="relative h-4 w-15">
                <Image 
                  src="/uploads/image/shiteni%20logo%20(1).png" 
                  alt="Shiteni" 
                  fill
                  className="object-contain"
                  sizes="60px"
                  priority
                  loading="eager"
                />
              </div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Shiteni</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Admin Navigation */}
            {isAdmin && hasPermission(userRole, '/dashboard/admin') && (
              <>
                <div className="space-y-1">
                  <Button
                    variant={pathname === '/dashboard/admin' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/admin')}
                  >
                    <Crown className="h-4 w-4" />
                    <span className="ml-2">Admin Dashboard</span>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Admin Management
                  </h3>
                  <div className="space-y-1">
                    {hasPermission(userRole, '/dashboard/admin/vendors') && (
                      <Button
                        variant={pathname === '/dashboard/admin/vendors' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/vendors')}
                      >
                        <Building2 className="h-4 w-4" />
                        <span className="ml-2">Vendors</span>
                      </Button>
                    )}
                    {hasPermission(userRole, '/dashboard/admin/users') && (
                      <Button
                        variant={pathname === '/dashboard/admin/users' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/users')}
                      >
                        <Users className="h-4 w-4" />
                        <span className="ml-2">Users</span>
                      </Button>
                    )}
                    {hasPermission(userRole, '/dashboard/admin/staffs') && (
                      <Button
                        variant={pathname === '/dashboard/admin/staffs' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/staffs')}
                      >
                        <UserCheck className="h-4 w-4" />
                        <span className="ml-2">Staff</span>
                      </Button>
                    )}
                    {hasPermission(userRole, '/dashboard/admin/subscription') && (
                      <Button
                        variant={pathname === '/dashboard/admin/subscription' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/subscription')}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="ml-2">Subscriptions</span>
                      </Button>
                    )}
                    {hasPermission(userRole, '/dashboard/admin/statistics') && (
                      <Button
                        variant={pathname === '/dashboard/admin/statistics' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/statistics')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="ml-2">Statistics</span>
                      </Button>
                    )}
                    {hasPermission(userRole, '/dashboard/admin/settings') && (
                      <Button
                        variant={pathname === '/dashboard/admin/settings' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/admin/settings')}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="ml-2">Settings</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Business Navigation */}
            {currentBusiness && (
              <>
                <div className="space-y-1">
                  <Button
                    variant={pathname === `/dashboard/vendor/${currentBusiness}` ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/vendor/${currentBusiness}`)}
                  >
                    {getBusinessIcon(currentBusiness)}
                    <span className="ml-2">Dashboard</span>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Modules ({navigationItems.length})
                  </h3>
                  <div className="space-y-1">
                    {navigationItems.length > 0 ? (
                      navigationItems.map((item) => (
                        <Button
                          key={item.href}
                          variant={pathname === item.href ? 'default' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => router.push(item.href)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.name}</span>
                        </Button>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground p-2">
                        No modules found for {currentBusiness}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Customer Navigation */}
            {userRole === 'customer' && (
              <>
                <div className="space-y-1">
                  <Button
                    variant={pathname === '/dashboard/customer' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/customer')}
                  >
                    <Home className="h-4 w-4" />
                    <span className="ml-2">Dashboard</span>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    My Account
                  </h3>
                  <div className="space-y-1">
                    <Button
                      variant={pathname === '/dashboard/customer/purchase' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/customer/purchase')}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span className="ml-2">Purchase</span>
                    </Button>
                    <Button
                      variant={pathname === '/dashboard/customer/bookings' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/customer/bookings')}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="ml-2">Bookings</span>
                    </Button>
                    <Button
                      variant={pathname === '/dashboard/customer/inbox' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/customer/inbox')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="ml-2">Inbox</span>
                    </Button>
                    <Button
                      variant={pathname === '/dashboard/customer/payments' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/customer/payments')}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="ml-2">Payments</span>
                    </Button>
                    <Button
                      variant={pathname === '/dashboard/customer/settings' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => router.push('/dashboard/customer/settings')}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="ml-2">Settings</span>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* General navigation */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                General
              </h3>
              <div className="space-y-1">
                {hasPermission(userRole, '/dashboard/admin/inbox') && (
                  <Button
                    variant={pathname === '/dashboard/admin/inbox' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/admin/inbox')}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="ml-2">Inbox</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/')}
                >
                  <Home className="h-4 w-4" />
                  <span className="ml-2">Home</span>
                </Button>
              </div>
            </div>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-medium text-white">
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {session.user?.email}
                </p>
                <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {getRoleDisplayName(userRole)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="hidden lg:block">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {isAdmin && pathname.startsWith('/dashboard/admin') 
                    ? 'Admin Dashboard' 
                    : currentBusiness 
                      ? businessConfigs[currentBusiness].name 
                      : 'Dashboard'
                  }
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  signOut({ callbackUrl: '/' });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
