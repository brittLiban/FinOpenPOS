'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentsSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check Stripe account status
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const response = await fetch('/api/stripe/account-status');
      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data);
      }
    } catch (error) {
      console.error('Failed to check account status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/admin/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Checking account status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {accountStatus?.charges_enabled ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-orange-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {accountStatus?.charges_enabled ? 'Payments Activated!' : 'Setup In Progress'}
          </h1>
          <p className="text-lg text-gray-600">
            {accountStatus?.charges_enabled 
              ? 'Your Stripe account is ready to accept payments.'
              : 'Your Stripe account setup is being processed.'}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>
              Current status of your payment processing setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Details Submitted</span>
                {accountStatus?.details_submitted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Charges Enabled</span>
                {accountStatus?.charges_enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payouts Enabled</span>
                {accountStatus?.payouts_enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {accountStatus?.charges_enabled ? (
          <div className="text-center">
            <Button onClick={handleContinue} size="lg">
              Continue to Dashboard
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <p className="text-orange-800 text-center mb-4">
                Your account setup is still being processed by Stripe. This can take a few minutes to several hours depending on your location and business type.
              </p>
              <div className="text-center space-x-4">
                <Button onClick={checkAccountStatus} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
                <Button onClick={handleContinue}>
                  Continue Anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
