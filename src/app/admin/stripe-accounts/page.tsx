"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConnectedAccount {
  id: string;
  business_name: string;
  email: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created: number;
  company_id?: string;
  company_name?: string;
}

export default function StripeAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/stripe/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Connected Stripe Accounts</h1>
        <div className="text-center">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Connected Stripe Accounts</h1>
        <Button onClick={fetchAccounts} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{account.business_name || account.company_name || 'Unknown Business'}</span>
                <div className="flex gap-2">
                  {account.charges_enabled ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      ✅ Payments Active
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      ❌ Payments Disabled
                    </span>
                  )}
                  {account.payouts_enabled ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      💰 Payouts Active
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      ⏸️ Payouts Paused
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Stripe Account ID:</strong>
                  <div className="font-mono text-gray-600">{account.id}</div>
                </div>
                <div>
                  <strong>Email:</strong>
                  <div className="text-gray-600">{account.email || 'Not provided'}</div>
                </div>
                <div>
                  <strong>Created:</strong>
                  <div className="text-gray-600">
                    {new Date(account.created * 1000).toLocaleDateString()}
                  </div>
                </div>
                {account.company_id && (
                  <div>
                    <strong>Company ID:</strong>
                    <div className="font-mono text-gray-600">{account.company_id}</div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800 mb-1">Revenue Tracking</h4>
                <p className="text-sm text-blue-700">
                  Platform fees (2.5%) from this account appear in your main Stripe dashboard.
                  <br />
                  Business transactions appear in this connected account: <code className="bg-blue-200 px-1 rounded">{account.id}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {accounts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No connected accounts found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Connected accounts will appear here when businesses complete Stripe onboarding.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔍 How to Track Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-800 mb-2">Your Platform Revenue</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Go to your main Stripe Dashboard</li>
              <li>• View "Application fees" section</li>
              <li>• This shows your 2.5% platform revenue</li>
              <li>• Filter by date range to see monthly earnings</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-800 mb-2">Customer Business Revenue</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click "View in Stripe" for any connected account above</li>
              <li>• Or go to Stripe → Connect → Accounts</li>
              <li>• Click on specific account ID to see their transactions</li>
              <li>• Each business sees only their own sales</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">Transaction Metadata</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Each transaction includes company_name in metadata</li>
              <li>• Platform fee amount is clearly marked</li>
              <li>• Easy to identify which business generated revenue</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
