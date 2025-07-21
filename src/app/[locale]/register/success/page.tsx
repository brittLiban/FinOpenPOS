'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Users, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
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
            Your account has been created successfully. Let's get you started!
          </p>
        </div>

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

        {/* What's Next Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Your Account Setup
              </CardTitle>
              <CardDescription>
                We've automatically set up your company with sample data to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Company profile created
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Admin role assigned to your account
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Sample products and categories added
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Payment methods configured
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Employee roles and permissions set up
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                Next Steps
              </CardTitle>
              <CardDescription>
                Here's what you can do once you log in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Customize your company settings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Add your real products and inventory
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Invite team members and assign roles
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  Start processing your first orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  Explore reporting and analytics
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What You Get With FinOpenPOS</CardTitle>
            <CardDescription>
              Your complete point-of-sale solution with everything you need to run your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Point of Sale</h3>
                <p className="text-sm text-gray-600">Fast checkout, receipt printing, multiple payment methods</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Team Management</h3>
                <p className="text-sm text-gray-600">Employee roles, permissions, and activity tracking</p>
              </div>
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Analytics & Reports</h3>
                <p className="text-sm text-gray-600">Sales reports, inventory tracking, business insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Link href="/login">
            <Button size="lg" className="mr-4">
              Continue to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <div className="text-sm text-gray-600">
            Need help getting started?{' '}
            <a href="mailto:support@finopenpos.com" className="text-blue-600 hover:underline">
              Contact our support team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
