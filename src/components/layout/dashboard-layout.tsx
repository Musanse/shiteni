'use client';

import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';
import { UserDropdown } from '@/components/ui/user-dropdown';
import { Search } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'customer' | 'institution' | 'staff' | 'admin';
  userName: string;
  userEmail?: string;
}

export function DashboardLayout({ children, userRole, userName, userEmail }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-80 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <ThemeToggle />
              <UserDropdown 
                userName={userName}
                userRole={userRole}
                userEmail={userEmail}
              />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
