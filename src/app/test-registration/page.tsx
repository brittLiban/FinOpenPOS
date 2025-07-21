'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, TestTube } from 'lucide-react';

export default function TestRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [testData, setTestData] = useState({
    companyName: 'Test Coffee Shop',
    businessType: 'cafe',
    firstName: 'John',
    lastName: 'Doe',
    email: `test${Date.now()}@example.com`, // Unique email for testing
    password: 'testpass123',
    phone: '(555) 123-4567',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    country: 'US'
  });

  const generateNewEmail = () => {
    setTestData({
      ...testData,
      email: `test${Date.now()}@example.com`
    });
  };

  const testDirectAPICall = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Generate a fake user ID for testing (in real scenario this comes from Supabase Auth)
      const fakeUserId = `test-user-${Date.now()}`;
      
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: testData.companyName,
          businessType: testData.businessType,
          ownerEmail: testData.email,
          ownerUserId: fakeUserId,
          contactInfo: {
            firstName: testData.firstName,
            lastName: testData.lastName,
            phone: testData.phone,
            address: testData.address,
            city: testData.city,
            state: testData.state,
            zipCode: testData.zipCode,
            country: testData.country
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register company');
      }

      setResult(data);
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Registration Testing Tool</h1>
          </div>
          <p className="text-gray-600">
            Test the company registration API without email rate limits
          </p>
        </div>

        <div className="space-y-6">
          {/* Rate Limit Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">About Rate Limiting</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Supabase limits email confirmations to prevent spam. During testing, use this tool 
                to test the company registration API directly, or wait 30+ seconds between normal registrations.
              </p>
            </div>
          </div>

          {/* Test Data Form */}
          <Card>
            <CardHeader>
              <CardTitle>Test Company Data</CardTitle>
              <CardDescription>
                Modify the test data and click "Test Registration API" to test without email confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={testData.companyName}
                    onChange={(e) => setTestData({...testData, companyName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <select
                    id="businessType"
                    title="Select business type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={testData.businessType}
                    onChange={(e) => setTestData({...testData, businessType: e.target.value})}
                  >
                    <option value="retail">Retail Store</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="grocery">Grocery Store</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={testData.firstName}
                    onChange={(e) => setTestData({...testData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={testData.lastName}
                    onChange={(e) => setTestData({...testData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email (Auto-generated for uniqueness)</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    value={testData.email}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button onClick={generateNewEmail} variant="outline" size="sm">
                    New Email
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={testData.phone}
                    onChange={(e) => setTestData({...testData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={testData.city}
                    onChange={(e) => setTestData({...testData, city: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                onClick={testDirectAPICall} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Registration API'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Registration Successful!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Company ID:</strong> {result.company?.id}</p>
                  <p><strong>Company Name:</strong> {result.company?.name}</p>
                  <p><strong>Company Slug:</strong> {result.company?.slug}</p>
                  <p><strong>User ID:</strong> {result.user?.id}</p>
                  <p><strong>User Email:</strong> {result.user?.email}</p>
                  <p className="text-green-700 mt-3">
                    ✅ Company created with sample data and isolated environment!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Test Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Option 1: API Testing (Recommended for development)</strong>
                <p className="text-gray-600">Use this page to test the registration API without email rate limits</p>
              </div>
              <div>
                <strong>Option 2: Full Registration Flow</strong>
                <p className="text-gray-600">
                  Go to <code className="bg-gray-100 px-1 rounded">/register</code> and use different email addresses, 
                  waiting 30+ seconds between attempts
                </p>
              </div>
              <div>
                <strong>Option 3: Production Testing</strong>
                <p className="text-gray-600">
                  In production, real users won't hit rate limits as they'll use unique emails
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
