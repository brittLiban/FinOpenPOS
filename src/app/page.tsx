
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ShoppingCart, Users, BarChart3, CreditCard, Smartphone, Cloud } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">FinOpenPOS</span>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            The Modern POS System for Growing Businesses
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete point-of-sale solution with inventory management, employee tracking, 
            analytics, and everything you need to run your business efficiently.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Your Free 14-Day Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Setup in under 5 minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern retail and service businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Complete POS System</CardTitle>
                <CardDescription>
                  Fast checkout, receipt printing, multiple payment methods, and real-time inventory updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Employee roles, permissions, time tracking, and performance analytics for your staff
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Business Analytics</CardTitle>
                <CardDescription>
                  Detailed reports, sales trends, inventory insights, and data-driven business decisions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>
                  Accept all major payment methods, split payments, and integrated payment processing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Mobile Ready</CardTitle>
                <CardDescription>
                  Works on tablets, phones, and desktops. Take your POS anywhere your business goes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Cloud className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Cloud-Based</CardTitle>
                <CardDescription>
                  Secure cloud storage, automatic backups, and access your data from anywhere
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing/CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using FinOpenPOS to streamline their operations
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Get Started Now - It's Free!
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-2xl font-bold">FinOpenPOS</span>
            </div>
            <p className="text-gray-400 mb-4">
              The complete point-of-sale solution for modern businesses
            </p>
            <div className="space-x-6 text-sm">
              <Link href="/login" className="hover:text-blue-400">Sign In</Link>
              <Link href="/register" className="hover:text-blue-400">Start Free Trial</Link>
              <a href="mailto:support@finopenpos.com" className="hover:text-blue-400">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
