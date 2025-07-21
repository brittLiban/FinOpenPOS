'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, User, Building } from 'lucide-react';

export default function UserRecoveryPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/status');
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixUserAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/status', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        // Refresh status after fix
        setTimeout(() => checkUserStatus(), 1000);
      } else {
        throw new Error(data.error || 'Failed to fix user access');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">User Recovery Tool</h1>
          <p className="text-gray-600">
            Check and fix orphaned users who have auth accounts but no company
          </p>
        </div>

        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery Actions</CardTitle>
              <CardDescription>
                Use these tools to diagnose and fix user access issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkUserStatus} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Checking...' : 'Check Current User Status'}
              </Button>
              
              <Button 
                onClick={fixUserAccess} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Fixing...' : 'Auto-Fix User Access'}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Status Display */}
          {status && (
            <Card className={status.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${status.error ? 'text-red-800' : 'text-green-800'}`}>
                  {status.error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  User Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {status.error ? (
                  <div className="space-y-2">
                    <p className="text-red-700 font-medium">Issue Found:</p>
                    <p className="text-red-600">{status.error}</p>
                    {status.user_id && (
                      <p className="text-sm text-red-600">User ID: {status.user_id}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User Info */}
                    {status.user && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          User Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>ID:</strong> {status.user.id}</p>
                          <p><strong>Email:</strong> {status.user.email}</p>
                          <p><strong>Name:</strong> {status.user.metadata?.first_name} {status.user.metadata?.last_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Profile Info */}
                    {status.profile && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4" />
                          Company Profile
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Company ID:</strong> {status.profile.company_id}</p>
                          <p><strong>Profile Created:</strong> ✅</p>
                          {status.created_company && (
                            <p className="text-green-600 font-medium">🎉 Company auto-created during recovery!</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Access Status */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">Access Status</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Admin Access:</strong> {status.has_admin_access ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Company Access:</strong> {status.company_access ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Roles:</strong> {status.roles?.length || 0} assigned</p>
                      </div>
                    </div>

                    {status.success && (
                      <div className="bg-green-100 p-3 rounded-lg">
                        <p className="text-green-800 font-medium">✅ {status.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How This Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Problem:</strong> User exists in Supabase Auth but has no company/profile
              </div>
              <div>
                <strong>Cause:</strong> Registration process failed after user creation
              </div>
              <div>
                <strong>Solution:</strong> Auto-create company and profile based on user data
              </div>
              <div>
                <strong>Result:</strong> User gets full admin access to their own company
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
