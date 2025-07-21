"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StripeStatus = {
  status: 'needs_onboarding' | 'incomplete' | 'complete' | 'error';
  account_id?: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  platform_fee_percent?: number;
  requirements?: any;
  error?: string;
  details?: string;
};

export default function StripeSettingsPage() {
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const fetchStripeStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();
      setStripeStatus(data);
    } catch (error) {
      console.error('Failed to fetch Stripe status:', error);
      setStripeStatus({
        status: 'error',
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        error: 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Failed to start onboarding'}`);
      }
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      alert('Failed to start Stripe onboarding');
    } finally {
      setOnboardingLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Stripe Payment Settings</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!stripeStatus) return null;
    
    switch (stripeStatus.status) {
      case 'complete':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">✅ Active</span>;
      case 'incomplete':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">⚠️ Incomplete</span>;
      case 'needs_onboarding':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">❌ Not Set Up</span>;
      case 'error':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">❌ Error</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Unknown</span>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stripe Payment Settings</h1>
        {getStatusBadge()}
      </div>

      {stripeStatus?.status === 'error' && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{stripeStatus.error}</p>
            {stripeStatus.details && (
              <p className="text-sm text-gray-600 mt-2">{stripeStatus.details}</p>
            )}
            <Button onClick={fetchStripeStatus} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Onboarding Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Processing Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stripeStatus?.status === 'needs_onboarding' && (
              <div>
                <p className="text-gray-600 mb-4">
                  To accept payments, you need to set up your Stripe account. This process takes 2-3 minutes 
                  and requires basic business information.
                </p>
                <Button 
                  onClick={startOnboarding}
                  disabled={onboardingLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {onboardingLoading ? 'Setting up...' : 'Set Up Payments'}
                </Button>
              </div>
            )}

            {stripeStatus?.status === 'incomplete' && (
              <div>
                <p className="text-yellow-600 mb-4">
                  Your Stripe account setup is incomplete. Please complete the onboarding process to accept payments.
                </p>
                <Button 
                  onClick={startOnboarding}
                  disabled={onboardingLoading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {onboardingLoading ? 'Loading...' : 'Complete Setup'}
                </Button>
                
                {stripeStatus.requirements && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Required Information:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {stripeStatus.requirements.currently_due?.map((req: string, index: number) => (
                        <li key={index}>• {req.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {stripeStatus?.status === 'complete' && (
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
                  <span className="text-xl mr-2">✅</span>
                  <span className="font-medium">Payment processing is active!</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-800">Charges</div>
                    <div className="text-green-600">
                      {stripeStatus.charges_enabled ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-800">Payouts</div>
                    <div className="text-green-600">
                      {stripeStatus.payouts_enabled ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-800">Platform Fee</div>
                    <div className="text-blue-600">
                      {stripeStatus.platform_fee_percent}%
                    </div>
                  </div>
                </div>

                {stripeStatus.account_id && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-800">Account ID</div>
                    <div className="font-mono text-sm text-gray-600">{stripeStatus.account_id}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Information */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How it Works</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Customers pay through Stripe's secure checkout</li>
                <li>• Funds are automatically transferred to your bank account</li>
                <li>• A small platform fee ({stripeStatus?.platform_fee_percent || 2.5}%) helps maintain the POS system</li>
                <li>• You keep the rest of your revenue</li>
                <li>• All transactions are tracked in your dashboard</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Security & Compliance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PCI DSS compliant payment processing</li>
                <li>• Bank-level security and encryption</li>
                <li>• Real-time fraud detection</li>
                <li>• Chargeback protection</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={fetchStripeStatus}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Status'}
              </Button>
              
              <Button 
                variant="default" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sync-products', { method: 'POST' });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`✅ ${data.message}`);
                    } else {
                      alert(`❌ ${data.error}`);
                    }
                  } catch (error) {
                    alert('❌ Failed to sync products');
                  }
                }}
                disabled={stripeStatus?.status !== 'complete'}
              >
                Sync Products to Stripe
              </Button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                • <strong>Refresh Status:</strong> Check for the latest account status from Stripe.
              </p>
              <p>
                • <strong>Sync Products:</strong> Create missing products in your Stripe account for checkout.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
