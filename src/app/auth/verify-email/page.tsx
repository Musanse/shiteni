'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to sign-in after 3 seconds
    const timer = setTimeout(() => {
      router.push('/auth/signin?message=' + encodeURIComponent('Email verification is currently disabled. You can sign in directly.'));
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification Disabled</CardTitle>
          <CardDescription>
            Email verification is currently disabled. You can sign in directly with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Your account is ready to use. You can sign in immediately without email verification.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to sign-in in a few seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
