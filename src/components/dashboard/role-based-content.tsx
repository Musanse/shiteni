'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  CreditCard, 
  BarChart3, 
  Activity,
  Shield,
  MessageSquare,
  Eye,
  CheckCircle,
  DollarSign,
  RotateCcw,
  AlertTriangle,
  Package,
  Settings,
} from 'lucide-react';
import { UserRole } from '@/types/roles';
import Link from 'next/link';

interface DashboardData {
  institution: {
    name: string;
    code: string;
    description: string;
  };
  overview: {
    totalApplications: number;
    monthlyApplications: number;
    totalLoanAmount: number;
    monthlyLoanAmount: number;
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    totalProducts: number;
    activeProducts: number;
  };
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    assessment: number;
    disbursement: number;
    recovery: number;
    defaulted: number;
  };
  financial: {
    disbursedAmount: number;
    outstandingAmount: number;
    recoveredAmount: number;
  };
  metrics: {
    approvalRate: number;
    disbursementRate: number;
    recoveryRate: number;
    defaultRate: number;
  };
}

interface RoleBasedContentProps {
  userRole: UserRole;
  dashboardData: DashboardData;
}

const roleBasedCards = {
  loan_officer: [
    {
      title: 'Applications',
      description: 'Review and process loan applications',
      icon: FileText,
      href: '/dashboard/institution/applications',
      primary: true,
      getStats: (data: DashboardData) => ({
        main: data.applications.pending,
        sub: `${data.applications.assessment} in assessment`
      })
    },
    {
      title: 'Assessment',
      description: 'Assess loan applications',
      icon: Eye,
      href: '/dashboard/institution/assessment',
      getStats: (data: DashboardData) => ({
        main: data.applications.assessment,
        sub: `${data.metrics.approvalRate.toFixed(1)}% approval rate`
      })
    },
    {
      title: 'Customers',
      description: 'View and manage customers',
      icon: Users,
      href: '/dashboard/institution/customers',
      getStats: (data: DashboardData) => ({
        main: data.overview.totalCustomers,
        sub: `${data.overview.activeCustomers} active`
      })
    },
    {
      title: 'Inbox',
      description: 'Manage customer communications',
      icon: MessageSquare,
      href: '/dashboard/institution/inbox',
      getStats: () => ({
        main: 'View',
        sub: 'Check messages'
      })
    },
  ],
  credit_analyst: [
    {
      title: 'Assessment',
      description: 'Perform credit assessments',
      icon: Eye,
      href: '/dashboard/institution/assessment',
      primary: true,
      getStats: (data: DashboardData) => ({
        main: data.applications.assessment,
        sub: `${data.metrics.approvalRate.toFixed(1)}% approval rate`
      })
    },
    {
      title: 'Due Diligence',
      description: 'Conduct due diligence checks',
      icon: Shield,
      href: '/dashboard/institution/dudeligence',
      getStats: (data: DashboardData) => ({
        main: data.applications.pending,
        sub: 'Pending review'
      })
    },
    {
      title: 'Analytics',
      description: 'View credit analytics',
      icon: BarChart3,
      href: '/dashboard/institution/analytics',
      getStats: (data: DashboardData) => ({
        main: `${data.metrics.recoveryRate.toFixed(1)}%`,
        sub: 'Recovery rate'
      })
    },
    {
      title: 'Defaulty',
      description: 'Monitor defaulted loans',
      icon: AlertTriangle,
      href: '/dashboard/institution/defaulty',
      getStats: (data: DashboardData) => ({
        main: data.applications.defaulted,
        sub: `${data.metrics.defaultRate.toFixed(1)}% rate`
      })
    },
    {
      title: 'Recovery',
      description: 'Manage loan recovery',
      icon: RotateCcw,
      href: '/dashboard/institution/recovery',
      getStats: (data: DashboardData) => ({
        main: data.applications.recovery,
        sub: `${(data.financial.recoveredAmount / 1000000).toFixed(1)}M recovered`
      })
    },
  ],
  customer_service: [
    {
      title: 'Inbox',
      description: 'Handle customer inquiries',
      icon: MessageSquare,
      href: '/dashboard/institution/inbox',
      primary: true,
      getStats: () => ({
        main: 'View',
        sub: 'Check messages'
      })
    },
    {
      title: 'Customers',
      description: 'View customer information',
      icon: Users,
      href: '/dashboard/institution/customers',
      getStats: (data: DashboardData) => ({
        main: data.overview.totalCustomers,
        sub: `${data.overview.activeCustomers} active`
      })
    },
    {
      title: 'Applications',
      description: 'View loan applications',
      icon: FileText,
      href: '/dashboard/institution/applications',
      getStats: (data: DashboardData) => ({
        main: data.overview.totalApplications,
        sub: `${data.overview.monthlyApplications} this month`
      })
    },
  ],
  manager: [
    {
      title: 'Applications',
      description: 'Review and manage applications',
      icon: FileText,
      href: '/dashboard/institution/applications',
      primary: true,
      getStats: (data: DashboardData) => ({
        main: data.overview.totalApplications,
        sub: `${data.overview.monthlyApplications} this month`
      })
    },
    {
      title: 'Assessment',
      description: 'Monitor loan assessments',
      icon: Eye,
      href: '/dashboard/institution/assessment',
      getStats: (data: DashboardData) => ({
        main: data.applications.assessment,
        sub: `${data.metrics.approvalRate.toFixed(1)}% approval rate`
      })
    },
    {
      title: 'Products',
      description: 'Manage loan products',
      icon: Package,
      href: '/dashboard/institution/products',
      getStats: (data: DashboardData) => ({
        main: data.overview.activeProducts,
        sub: `${data.overview.totalProducts} total`
      })
    },
    {
      title: 'Staff',
      description: 'Manage staff members',
      icon: Users,
      href: '/dashboard/institution/staffs',
      getStats: () => ({
        main: 'View',
        sub: 'Manage staff'
      })
    },
    {
      title: 'Approvals',
      description: 'Review and approve loans',
      icon: CheckCircle,
      href: '/dashboard/institution/approvals',
      getStats: (data: DashboardData) => ({
        main: data.applications.approved,
        sub: `${data.metrics.approvalRate.toFixed(1)}% rate`
      })
    },
    {
      title: 'Disbursement',
      description: 'Manage loan disbursements',
      icon: CreditCard,
      href: '/dashboard/institution/disbursement',
      getStats: (data: DashboardData) => ({
        main: data.applications.disbursement,
        sub: `${data.metrics.disbursementRate.toFixed(1)}% rate`
      })
    },
    {
      title: 'Recovery',
      description: 'Monitor loan recovery',
      icon: RotateCcw,
      href: '/dashboard/institution/recovery',
      getStats: (data: DashboardData) => ({
        main: data.applications.recovery,
        sub: `${(data.financial.recoveredAmount / 1000000).toFixed(1)}M recovered`
      })
    },
    {
      title: 'Defaulty',
      description: 'Handle defaulted loans',
      icon: AlertTriangle,
      href: '/dashboard/institution/defaulty',
      getStats: (data: DashboardData) => ({
        main: data.applications.defaulted,
        sub: `${data.metrics.defaultRate.toFixed(1)}% rate`
      })
    },
    {
      title: 'Customers',
      description: 'View all customers',
      icon: Users,
      href: '/dashboard/institution/customers',
      getStats: (data: DashboardData) => ({
        main: data.overview.totalCustomers,
        sub: `${data.overview.activeCustomers} active`
      })
    },
    {
      title: 'Due Diligence',
      description: 'Review due diligence',
      icon: Shield,
      href: '/dashboard/institution/dudeligence',
      getStats: (data: DashboardData) => ({
        main: data.applications.pending,
        sub: 'Pending review'
      })
    },
    {
      title: 'Analytics',
      description: 'View business analytics',
      icon: BarChart3,
      href: '/dashboard/institution/analytics',
      getStats: (data: DashboardData) => ({
        main: `${data.metrics.recoveryRate.toFixed(1)}%`,
        sub: 'Recovery rate'
      })
    },
    {
      title: 'Settings',
      description: 'Configure institution settings',
      icon: Settings,
      href: '/dashboard/institution/settings',
      getStats: () => ({
        main: 'View',
        sub: 'Configure'
      })
    },
    {
      title: 'Inbox',
      description: 'Manage communications',
      icon: MessageSquare,
      href: '/dashboard/institution/inbox',
      getStats: () => ({
        main: 'View',
        sub: 'Check messages'
      })
    },
    {
      title: 'Subscription',
      description: 'Manage subscription',
      icon: DollarSign,
      href: '/dashboard/institution/subscription',
      getStats: () => ({
        main: 'View',
        sub: 'Manage plan'
      })
    },
  ],
};

export function RoleBasedContent({ userRole, dashboardData }: RoleBasedContentProps) {
  const cards = roleBasedCards[userRole] || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const stats = card.getStats(dashboardData);
        return (
          <Link key={index} href={card.href}>
            <Card className={`hover:shadow-lg transition-shadow ${card.primary ? 'border-primary' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <card.icon className="h-5 w-5 text-primary" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-2xl font-bold">{stats.main}</div>
                  <p className="text-sm text-muted-foreground">{stats.sub}</p>
                </div>
                <Button className="w-full" variant={card.primary ? 'default' : 'outline'}>
                  {card.primary ? 'Go to ' + card.title.toLowerCase() : 'View ' + card.title.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}