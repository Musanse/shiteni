'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  CreditCard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  ArrowLeft,
  Building2,
  Shield,
  UserCheck,
  Mail,
  Target,
  Activity,
  DollarSign,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Package,
  MessageSquare,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './button';
import { UserRole, rolePagePermissions, InstitutionStaffRole } from '@/types/roles';

interface SidebarProps {
  userRole: UserRole;
  className?: string;
}

const customerNavItems = [
  { name: 'Dashboard', href: '/dashboard/customer', icon: Home },
  { name: 'Bookings', href: '/dashboard/customer/bookings', icon: FileText },
  { name: 'Inbox', href: '/dashboard/customer/inbox', icon: MessageSquare },
  { name: 'Payments', href: '/dashboard/customer/payments', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/customer/settings', icon: Settings },
];

const institutionNavItems = [
  { name: 'Dashboard', href: '/dashboard/institution', icon: Home },
  { name: 'Applications', href: '/dashboard/institution/applications', icon: FileText },
  { name: 'Assessment', href: '/dashboard/institution/assessment', icon: Eye },
  { name: 'Products', href: '/dashboard/institution/products', icon: Package },
  { name: 'Staff', href: '/dashboard/institution/staffs', icon: Users },
  { name: 'Approvals', href: '/dashboard/institution/approvals', icon: CheckCircle },
  { name: 'Disbursement', href: '/dashboard/institution/disbursement', icon: CreditCard },
  { name: 'Recovery', href: '/dashboard/institution/recovery', icon: RotateCcw },
  { name: 'Defaulty', href: '/dashboard/institution/defaulty', icon: AlertTriangle },
  { name: 'Customers', href: '/dashboard/institution/customers', icon: UserCheck },
  { name: 'Due Diligence', href: '/dashboard/institution/dudeligence', icon: Shield },
  { name: 'Analytics', href: '/dashboard/institution/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/institution/settings', icon: Settings },
  { name: 'Inbox', href: '/dashboard/institution/inbox', icon: MessageSquare },
  { name: 'Subscription', href: '/dashboard/institution/subscription', icon: DollarSign },
];

const adminNavItems = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
  { name: 'Institutions', href: '/dashboard/admin/institutions', icon: Building2 },
  { name: 'Staff', href: '/dashboard/admin/staffs', icon: Users },
  { name: 'Inbox', href: '/dashboard/admin/inbox', icon: Mail },
  { name: 'Users', href: '/dashboard/admin/users', icon: UserCheck },
  { name: 'Compliance', href: '/dashboard/admin/compliance', icon: Shield },
  { name: 'Due Diligence', href: '/dashboard/admin/dudeligence', icon: Target },
  { name: 'System Health', href: '/dashboard/admin/systemhealth', icon: Activity },
  { name: 'Subscriptions', href: '/dashboard/admin/subscription', icon: DollarSign },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

// Role-based navigation items
const staffNavItems: Record<InstitutionStaffRole, typeof institutionNavItems> = {
  loan_officer: [
    { name: 'Dashboard', href: '/dashboard/institution', icon: Home },
    { name: 'Applications', href: '/dashboard/institution/applications', icon: FileText },
    { name: 'Assessment', href: '/dashboard/institution/assessment', icon: Eye },
    { name: 'Customers', href: '/dashboard/institution/customers', icon: UserCheck },
    { name: 'Inbox', href: '/dashboard/institution/inbox', icon: MessageSquare },
  ],
  credit_analyst: [
    { name: 'Dashboard', href: '/dashboard/institution', icon: Home },
    { name: 'Assessment', href: '/dashboard/institution/assessment', icon: Eye },
    { name: 'Due Diligence', href: '/dashboard/institution/dudeligence', icon: Shield },
    { name: 'Analytics', href: '/dashboard/institution/analytics', icon: BarChart3 },
    { name: 'Defaulty', href: '/dashboard/institution/defaulty', icon: AlertTriangle },
    { name: 'Recovery', href: '/dashboard/institution/recovery', icon: RotateCcw },
  ],
  customer_service: [
    { name: 'Dashboard', href: '/dashboard/institution', icon: Home },
    { name: 'Inbox', href: '/dashboard/institution/inbox', icon: MessageSquare },
    { name: 'Customers', href: '/dashboard/institution/customers', icon: UserCheck },
    { name: 'Applications', href: '/dashboard/institution/applications', icon: FileText },
  ],
  manager: institutionNavItems, // Managers have access to all institution pages
};

export function Sidebar({ userRole, className }: SidebarProps) {
  const pathname = usePathname();
  
  const getNavItems = () => {
    switch (userRole) {
      case 'customer':
        return customerNavItems;
      case 'institution':
        return institutionNavItems;
      case 'admin':
        return adminNavItems;
      case 'loan_officer':
      case 'credit_analyst':
      case 'customer_service':
      case 'manager':
        return staffNavItems[userRole] || [];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className={cn('flex h-full w-64 flex-col bg-card border-r', className)}>
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-primary">Mankuca</h1>
      </div>
      
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <ArrowLeft className="mr-3 h-5 w-5" />
            Go back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}