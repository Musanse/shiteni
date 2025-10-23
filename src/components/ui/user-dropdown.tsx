'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ProfileModal } from './profile-modal';
import { 
  User, 
  LogOut, 
  ChevronDown,
  Shield,
  Building2,
  CreditCard
} from 'lucide-react';
import { UserRole, roleLabels } from '@/types/roles';

interface UserDropdownProps {
  userName: string;
  userRole: UserRole;
  userEmail?: string;
}

export function UserDropdown({ userName, userRole, userEmail }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Function to refresh user profile data
  const refreshUserProfile = async () => {
    try {
      const response = await fetch('/api/customer/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.profilePicture) {
          setUserAvatar(data.user.profilePicture);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fetch user profile data including avatar
  useEffect(() => {
    refreshUserProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'institution':
      case 'loan_officer':
      case 'credit_analyst':
      case 'customer_service':
      case 'manager':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'customer':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = () => {
    return roleLabels[userRole] || 'User';
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin':
        return 'text-red-600';
      case 'institution':
      case 'loan_officer':
      case 'credit_analyst':
      case 'customer_service':
      case 'manager':
        return 'text-blue-600';
      case 'customer':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 h-auto p-2 hover:bg-muted/50"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="Avatar" 
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-foreground">{userName}</span>
          <span className={`text-xs ${getRoleColor()}`}>{getRoleLabel()}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-50">
            {/* User Info Header */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-medium">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt="Avatar" 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{userName}</div>
                  <div className="text-sm text-muted-foreground truncate">{userEmail || 'No email'}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {getRoleIcon()}
                    <span className={`text-xs ${getRoleColor()}`}>{getRoleLabel()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-4 py-2 h-auto text-left"
                onClick={() => {
                  setIsOpen(false);
                  setIsProfileModalOpen(true);
                }}
              >
                <User className="h-4 w-4 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="text-sm">Profile</span>
                  <span className="text-xs text-muted-foreground">View your profile</span>
                </div>
              </Button>
            </div>
            
            {/* Sign Out */}
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-4 py-2 h-auto text-left text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Sign out</span>
                  <span className="text-xs text-muted-foreground">End your session</span>
                </div>
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onAvatarUploaded={setUserAvatar}
        onRefreshProfile={refreshUserProfile}
      />
    </div>
  );
}