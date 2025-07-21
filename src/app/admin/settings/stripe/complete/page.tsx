"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function StripeOnboardingComplete() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Check the account status after onboarding
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/stripe/connect');
        const data = await response.json();
        
        if (data.status === 'complete') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifying your account...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center max-w-md">
        {status === 'success' ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Setup Complete!</h1>
            <p className="text-lg text-gray-700 mb-6">
              Your Stripe account is now active and ready to accept payments.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/admin/checkout')}
                className="w-full"
              >
                Start Taking Payments
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/admin/settings/stripe')}
                className="w-full"
              >
                View Settings
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-yellow-600 mb-4">Setup Incomplete</h1>
            <p className="text-lg text-gray-700 mb-6">
              Your Stripe account setup is not complete yet. You may need to provide additional information.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/admin/settings/stripe')}
                className="w-full"
              >
                Complete Setup
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/admin')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
