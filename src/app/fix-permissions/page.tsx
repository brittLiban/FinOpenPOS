'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FixPermissionsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkPermissions = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/check-permissions');
      const data = await response.json();
      setStatus({ type: 'check', data, success: response.ok });
    } catch (error: any) {
      setStatus({ type: 'check', error: error.message, success: false });
    }
    setChecking(false);
  };

  const fixPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setStatus({ type: 'fix', data, success: response.ok });
    } catch (error: any) {
      setStatus({ type: 'fix', error: error.message, success: false });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Fix Admin Permissions
          </h1>
          <p className="text-gray-600">
            Diagnose and fix missing company_id or role assignments
          </p>
        </div>

        <div className="grid gap-6">
          {/* Check Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>1. Check Current Permissions</CardTitle>
              <CardDescription>
                See your current user, profile, company, and role status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={checkPermissions} 
                disabled={checking}
                variant="outline"
                className="mb-4"
              >
                {checking ? 'Checking...' : 'Check My Permissions'}
              </Button>
              
              {status?.type === 'check' && (
                <div className={`p-4 rounded-lg ${status.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <pre className="text-sm overflow-auto max-h-96">
                    {JSON.stringify(status.data || status.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fix Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>2. Fix Missing Permissions</CardTitle>
              <CardDescription>
                Restore admin role and company ownership if missing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fixPermissions} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Fixing...' : 'Fix My Permissions'}
              </Button>
              
              {status?.type === 'fix' && (
                <div className={`p-4 rounded-lg ${status.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {status.success ? (
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">✅ Permissions Fixed!</h3>
                      <p className="text-green-700 mb-2">Your admin permissions have been restored.</p>
                      <p className="text-sm text-green-600">You can now refresh the admin dashboard.</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">❌ Fix Failed</h3>
                      <pre className="text-sm text-red-700">
                        {JSON.stringify(status.data || status.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>3. Quick Actions</CardTitle>
              <CardDescription>
                After fixing permissions, test these links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Button variant="outline" asChild>
                  <a href="/admin" target="_blank">Test Admin Dashboard</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/admin/customers" target="_blank">Test Customer Management</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/admin/products" target="_blank">Test Product Management</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/user/status" target="_blank">Check User Status API</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
