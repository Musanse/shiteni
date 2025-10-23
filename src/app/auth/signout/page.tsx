'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Sign out the user and redirect to home page
    signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Signing out...</h2>
        <p className="text-muted-foreground">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
