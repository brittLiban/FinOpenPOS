"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, CreditCardIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';

interface CompanyStripeInfo {
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarding_complete: boolean;
  stripe_details_submitted: boolean;
}

export default function StripeAccountPage() {
  const [stripeInfo, setStripeInfo] = useState<CompanyStripeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStripeInfo = async () => {
    try {
      const response = await fetch('/api/admin/stripe-status');
      if (response.ok) {
        const data = await response.json();
        setStripeInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeInfo();
  }, []);

  const handleConnectStripe = async () => {
    try {
      const response = await fetch('/api/stripe/connect', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
    }
  };

  const handleAccessStripeAccount = () => {
    if (stripeInfo?.stripe_account_id) {
      window.open(`https://dashboard.stripe.com/acct_${stripeInfo.stripe_account_id}/dashboard`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Stripe Account</h1>
        <div className="text-center">Loading account information...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCardIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Payment Account</h1>
      </div>

      {!stripeInfo?.stripe_account_id ? (
        // Not connected to Stripe
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5 text-orange-500" />
              Connect Your Payment Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To start accepting payments, you need to connect your business to Stripe. 
              This allows you to securely process credit card payments and receive payouts.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">What happens when you connect:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Secure payment processing for your business</li>
                <li>• Direct payouts to your bank account</li>
                <li>• Access to transaction history and reports</li>
                <li>• Fraud protection and dispute management</li>
              </ul>
            </div>

            <Button onClick={handleConnectStripe} className="w-full">
              Connect to Stripe
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Connected to Stripe
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                Payment Account Connected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Account ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {stripeInfo.stripe_account_id}
                    </code>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Charges:</span>
                    <span className={`text-sm ${stripeInfo.stripe_charges_enabled ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeInfo.stripe_charges_enabled ? 'Enabled' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Payouts:</span>
                    <span className={`text-sm ${stripeInfo.stripe_payouts_enabled ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeInfo.stripe_payouts_enabled ? 'Enabled' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Onboarding:</span>
                    <span className={`text-sm ${stripeInfo.stripe_onboarding_complete ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeInfo.stripe_onboarding_complete ? 'Complete' : 'In Progress'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Details:</span>
                    <span className={`text-sm ${stripeInfo.stripe_details_submitted ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeInfo.stripe_details_submitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleAccessStripeAccount} 
                className="w-full"
                variant="outline"
              >
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                Access Your Stripe Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                Managing Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">View Transactions</h4>
                  <p className="text-sm text-gray-600">
                    Access your Stripe dashboard to view all payment transactions, customer information, and detailed reports.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Payout Schedule</h4>
                  <p className="text-sm text-gray-600">
                    Configure when and how you receive payouts from your sales. Funds are typically available within 2 business days.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Account Settings</h4>
                  <p className="text-sm text-gray-600">
                    Update your business information, banking details, and notification preferences directly in Stripe.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Support</h4>
                  <p className="text-sm text-gray-600">
                    For payment-related issues or questions, contact Stripe support directly through your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
