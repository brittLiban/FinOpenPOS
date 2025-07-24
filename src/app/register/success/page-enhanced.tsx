'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Users, ShoppingCart, BarChart3, Settings, ExternalLink, CreditCard, Globe } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  const [countdown, setCountdown] = useState(15);
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    // Get registration data from sessionStorage
    const data = sessionStorage.getItem('registrationSuccess');
    if (data) {
      setRegistrationData(JSON.parse(data));
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStripeOnboarding = () => {
    if (registrationData?.onboarding?.stripe_onboarding_url) {
      window.open(registrationData.onboarding.stripe_onboarding_url, '_blank');
    }
  };

  const handleVisitTenant = () => {
    if (registrationData?.onboarding?.tenant_url) {
      window.open(registrationData.onboarding.tenant_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to FinOpenPOS!</h1>
          <p className="text-xl text-gray-600">
            Your multi-tenant POS system has been created successfully!
          </p>
          {registrationData?.company?.subdomain && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
              <p className="text-sm font-medium text-blue-900">Your POS URL:</p>
              <p className="text-lg font-bold text-blue-700">
                {registrationData.onboarding.tenant_url}
              </p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {registrationData && (
          <div className="grid gap-6 mb-8 md:grid-cols-2">
            {/* Stripe Onboarding */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-900">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Set Up Payments (Required)
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Complete Stripe onboarding to accept payments and start processing transactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStripeOnboarding}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Complete Stripe Setup
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-orange-600 mt-2">
                  This is required to process payments in your POS system.
                </p>
              </CardContent>
            </Card>

            {/* Visit Your POS */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <Globe className="h-5 w-5 mr-2" />
                  Visit Your POS System
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Access your dedicated POS system with sample products ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleVisitTenant}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Open Your POS
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-blue-600 mt-2">
                  Your system is ready with sample data to explore.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auto-redirect notice */}
        <div className="text-center mb-8">
          <Card className="inline-block">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                You'll be automatically redirected to login in{' '}
                <span className="font-bold text-blue-600">{countdown}</span> seconds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="text-center">
            <CardHeader>
              <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto" />
              <CardTitle className="text-lg">Point of Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Process sales with barcode scanning and inventory management
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-green-500 mx-auto" />
              <CardTitle className="text-lg">Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Add employees with role-based permissions and access control
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-500 mx-auto" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track sales, inventory levels, and business performance
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="h-8 w-8 text-orange-500 mx-auto" />
              <CardTitle className="text-lg">Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure your POS system to match your business needs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        {registrationData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Account Details</CardTitle>
              <CardDescription>
                Here's what we've set up for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-sm text-gray-700">Company Information</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li><strong>Name:</strong> {registrationData.company.name}</li>
                    <li><strong>Business Type:</strong> {registrationData.company.business_type}</li>
                    <li><strong>Subdomain:</strong> {registrationData.company.subdomain}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700">Your Access</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li><strong>Role:</strong> Admin (Full Access)</li>
                    <li><strong>Email:</strong> {registrationData.user.email}</li>
                    <li><strong>Features:</strong> All {registrationData.permissions?.length || 0} modules enabled</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>
              Follow these steps to get your POS system running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Complete Stripe onboarding</strong> - This enables payment processing for your POS
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Check your email</strong> - Confirm your account to enable all features
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Login to your POS</strong> - Start with the sample products we've created
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  4
                </span>
                <div>
                  <strong>Add your products</strong> - Replace sample data with your actual inventory
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  5
                </span>
                <div>
                  <strong>Invite your team</strong> - Add employees and assign roles
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Manual Actions */}
        <div className="text-center mt-8 space-x-4">
          <Link href="/login">
            <Button>
              Go to Login Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          <Link href="/register">
            <Button variant="outline">
              Register Another Company
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
