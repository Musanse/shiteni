'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function ManualVerificationPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerifyByEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manual-verify?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to verify email' });
    }
    setLoading(false);
  };

  const handleVerifyByToken = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manual-verify?token=${encodeURIComponent(token)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to verify token' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Manual Email Verification</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Verify by Email:</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button 
                onClick={handleVerifyByEmail}
                disabled={loading || !email}
              >
                Verify
              </Button>
            </div>
          </div>

          <div className="text-center text-gray-500">OR</div>

          <div>
            <label className="block text-sm font-medium mb-2">Verify by Token:</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="verification token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button 
                onClick={handleVerifyByToken}
                disabled={loading || !token}
              >
                Verify
              </Button>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded ${
              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.success ? (
                <div>
                  <p className="font-semibold">✅ Verification Successful!</p>
                  <p>User: {result.user?.firstName} {result.user?.lastName}</p>
                  <p>Email: {result.user?.email}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">❌ Verification Failed</p>
                  <p>{result.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600 mt-4">
            <p><strong>Note:</strong> This is a temporary solution while SMTP is being fixed.</p>
            <p>Users can be verified manually using their email address or verification token.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
