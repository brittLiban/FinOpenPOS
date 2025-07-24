'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentsRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after a moment
    const timer = setTimeout(() => {
      router.push('/settings/payments');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRetry = async () => {
    try {
      // Generate new onboarding link
      const response = await fetch('/api/stripe/onboarding-link', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        router.push('/settings/payments');
      }
    } catch (error) {
      console.error('Failed to create onboarding link:', error);
      router.push('/settings/payments');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Interrupted</h1>
          <p className="text-lg text-gray-600">
            Your Stripe account setup was interrupted or expired.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
            <CardDescription>
              This can occur if the setup process was closed or took too long to complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Don't worry - no progress has been lost. You can continue setting up your Stripe account 
              or return to your settings page to try again later.
            </p>
            
            <div className="text-center space-x-4">
              <Button onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Continue Setup
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/settings/payments')}
              >
                Back to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
