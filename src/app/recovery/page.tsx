'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PublicRecoveryPage() {
  const [email, setEmail] = useState('liban3367@ymail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAndFixUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/recovery/fix-orphaned-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        throw new Error(data.error || 'Failed to fix user');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Recovery</h1>
          <p className="text-gray-600">
            Fix accounts that were created but missing company information
          </p>
        </div>

        <div className="space-y-6">
          {/* Recovery Form */}
          <Card>
            <CardHeader>
              <CardTitle>Fix Orphaned Account</CardTitle>
              <CardDescription>
                Enter the email address of an account that needs to be fixed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <Button 
                onClick={checkAndFixUser} 
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? 'Fixing Account...' : 'Check & Fix Account'}
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

          {/* Success Display */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Account Fixed Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-green-700">✅ {result.message}</p>
                  {result.company && (
                    <div className="bg-white p-3 rounded border">
                      <p className="font-medium">Company Created:</p>
                      <p className="text-sm">Name: {result.company.name}</p>
                      <p className="text-sm">ID: {result.company.id}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-green-700 mb-4">Your account is now ready to use!</p>
                  <Link href="/login">
                    <Button className="w-full">
                      Continue to Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle>What This Does</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Problem:</strong> Sometimes during registration, a user account gets created 
                but the company setup fails, leaving an "orphaned" user.
              </p>
              <p>
                <strong>Solution:</strong> This tool finds orphaned users and automatically creates 
                their company, profile, and admin access.
              </p>
              <p>
                <strong>What gets created:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Company record with default settings</li>
                <li>User profile linked to the company</li>
                <li>Admin role and permissions</li>
                <li>Sample data (products, customers, payment methods)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Alternative Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Other Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Create New Account Instead
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Try Login (Auto-recovery will run)
                </Button>
              </Link>
              <Link href="/routes">
                <Button variant="outline" className="w-full">
                  Back to Routes Overview
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
