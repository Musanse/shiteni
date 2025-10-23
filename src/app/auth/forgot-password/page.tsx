'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    try {
      setStatus('loading');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset link sent!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send password reset email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while sending password reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Mail className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            {status === 'form' && 'Enter your email address and we\'ll send you a link to reset your password'}
            {status === 'loading' && 'Sending password reset link...'}
            {status === 'success' && 'Password reset link sent!'}
            {status === 'error' && 'There was an issue sending the reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">{message}</p>
              <p className="text-sm text-gray-600">
                Please check your email inbox and follow the instructions to reset your password.
                The link will expire in 1 hour.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/auth/signin'}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
                <Button 
                  onClick={() => {
                    setStatus('form');
                    setEmail('');
                    setMessage('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{message}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setStatus('form');
                    setMessage('');
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth/signin'}
                  variant="outline"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  Send Reset Link
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/auth/signin'}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
