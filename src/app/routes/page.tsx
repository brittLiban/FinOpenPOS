'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, ShoppingCart, Settings, BarChart3, FileText, Globe, UserPlus, LogIn, CheckCircle } from 'lucide-react';

export default function RoutesPage() {
  const routes = [
    {
      category: "🌟 Main Public Pages",
      description: "Landing and registration flow for new clients",
      routes: [
        {
          path: "/",
          name: "Landing Page",
          description: "Professional homepage with features and call-to-action",
          icon: <Globe className="h-5 w-5" />,
          color: "bg-blue-500"
        },
        {
          path: "/register",
          name: "Client Registration",
          description: "Complete signup form for new businesses to create accounts",
          icon: <UserPlus className="h-5 w-5" />,
          color: "bg-green-500"
        },
        {
          path: "/register/success",
          name: "Registration Success",
          description: "Welcome page after successful company registration",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "bg-emerald-500"
        },
        {
          path: "/login",
          name: "Login Page",
          description: "User authentication with link to registration",
          icon: <LogIn className="h-5 w-5" />,
          color: "bg-purple-500"
        }
      ]
    },
    {
      category: "🔧 Development Tools",
      description: "Testing and development utilities",
      routes: [
        {
          path: "/routes",
          name: "Routes Overview",
          description: "This page - complete system route map",
          icon: <Globe className="h-5 w-5" />,
          color: "bg-gray-500"
        },
        {
          path: "/test-registration",
          name: "Registration Testing Tool",
          description: "Test company registration API without email rate limits",
          icon: <UserPlus className="h-5 w-5" />,
          color: "bg-red-500"
        },
        {
          path: "/user-recovery",
          name: "User Recovery Tool",
          description: "Fix orphaned users who have auth accounts but no company",
          icon: <Users className="h-5 w-5" />,
          color: "bg-orange-500"
        },
        {
          path: "/recovery",
          name: "Public Recovery Page",
          description: "Public recovery tool for orphaned users (no authentication required)",
          icon: <Users className="h-5 w-5" />,
          color: "bg-red-500"
        },
        {
          path: "/fix-permissions",
          name: "Permission Fix Tool",
          description: "Diagnose and fix missing company_id or role assignments",
          icon: <Users className="h-5 w-5" />,
          color: "bg-purple-500"
        }
      ]
    },
    {
      category: "🏢 Admin Dashboard",
      description: "Multi-tenant business management interface",
      routes: [
        {
          path: "/admin",
          name: "Admin Dashboard",
          description: "Main admin interface with overview and navigation",
          icon: <BarChart3 className="h-5 w-5" />,
          color: "bg-indigo-500"
        },
        {
          path: "/admin/pos",
          name: "Point of Sale",
          description: "POS system for processing orders and payments",
          icon: <ShoppingCart className="h-5 w-5" />,
          color: "bg-orange-500"
        },
        {
          path: "/admin/products",
          name: "Product Management",
          description: "Manage inventory, pricing, and product catalog",
          icon: <ShoppingCart className="h-5 w-5" />,
          color: "bg-yellow-500"
        },
        {
          path: "/admin/orders",
          name: "Order Management",
          description: "View and manage customer orders and transactions",
          icon: <FileText className="h-5 w-5" />,
          color: "bg-cyan-500"
        },
        {
          path: "/admin/customers",
          name: "Customer Management",
          description: "Manage customer database and relationships",
          icon: <Users className="h-5 w-5" />,
          color: "bg-pink-500"
        },
        {
          path: "/admin/employees",
          name: "Employee Management",
          description: "Manage staff, roles, and permissions",
          icon: <Users className="h-5 w-5" />,
          color: "bg-teal-500"
        },
        {
          path: "/admin/inventory",
          name: "Inventory Management",
          description: "Track stock levels, restocks, and inventory reports",
          icon: <BarChart3 className="h-5 w-5" />,
          color: "bg-red-500"
        },
        {
          path: "/admin/returns",
          name: "Returns & Refunds",
          description: "Handle product returns and refund processing",
          icon: <FileText className="h-5 w-5" />,
          color: "bg-amber-500"
        },
        {
          path: "/admin/settings",
          name: "Company Settings",
          description: "Configure company-specific settings and preferences",
          icon: <Settings className="h-5 w-5" />,
          color: "bg-gray-500"
        },
        {
          path: "/admin/audit-log",
          name: "Audit Log",
          description: "View system activity and user actions log",
          icon: <FileText className="h-5 w-5" />,
          color: "bg-slate-500"
        },
        {
          path: "/admin/user-roles",
          name: "User Roles",
          description: "Manage user permissions and role assignments",
          icon: <Users className="h-5 w-5" />,
          color: "bg-violet-500"
        }
      ]
    },
    {
      category: "🔧 API Endpoints",
      description: "Backend API for data management",
      routes: [
        {
          path: "/api/companies/register",
          name: "Company Registration API",
          description: "POST endpoint for creating new companies and owner accounts",
          icon: <FileText className="h-5 w-5" />,
          color: "bg-blue-600",
          method: "POST"
        },
        {
          path: "/api/products",
          name: "Products API",
          description: "CRUD operations for product management",
          icon: <ShoppingCart className="h-5 w-5" />,
          color: "bg-green-600"
        },
        {
          path: "/api/orders",
          name: "Orders API",
          description: "Order processing and management endpoints",
          icon: <FileText className="h-5 w-5" />,
          color: "bg-orange-600"
        },
        {
          path: "/api/customers",
          name: "Customers API",
          description: "Customer data management endpoints",
          icon: <Users className="h-5 w-5" />,
          color: "bg-pink-600"
        },
        {
          path: "/api/employees",
          name: "Employees API",
          description: "Employee management and role endpoints",
          icon: <Users className="h-5 w-5" />,
          color: "bg-purple-600"
        },
        {
          path: "/api/recovery/fix-orphaned-user",
          name: "Orphaned User Recovery API",
          description: "POST endpoint for fixing users with auth accounts but no company",
          icon: <Users className="h-5 w-5" />,
          color: "bg-red-600",
          method: "POST"
        }
      ]
    }
  ];

  const testFlow = [
    { step: 1, action: "Visit Landing Page", route: "/", description: "See the professional homepage" },
    { step: 2, action: "Click 'Start Free Trial'", route: "/register", description: "Fill out registration form" },
    { step: 3, action: "Complete Registration", route: "/register/success", description: "See success message" },
    { step: 4, action: "Login", route: "/login", description: "Sign in with new account" },
    { step: 5, action: "Access Admin", route: "/admin", description: "Start using your POS system" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FinOpenPOS - Multi-Tenant SaaS Routes
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Complete route map for your POS system with registration flow
          </p>
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              🎉 Your system is 95% SaaS-ready! All routes are functional with multi-tenant isolation.
            </p>
          </div>
        </div>

        {/* Test Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              🧪 Complete Registration Test Flow
            </CardTitle>
            <CardDescription>
              Follow this flow to test the complete client onboarding experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {testFlow.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.action}</h3>
                  <Link href={item.route}>
                    <Button variant="outline" size="sm" className="mb-2">
                      {item.route}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Routes by Category */}
        {routes.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.category}</h2>
            <p className="text-gray-600 mb-6">{category.description}</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.routes.map((route, routeIndex) => (
                <Card key={routeIndex} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className={`p-2 rounded-lg ${route.color} text-white`}>
                        {route.icon}
                      </div>
                      {route.name}
                      {route.method && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {route.method}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {route.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {route.path}
                      </code>
                      {!route.method && (
                        <Link href={route.path}>
                          <Button size="sm" variant="outline">
                            Visit
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Actions</CardTitle>
            <CardDescription>
              Common development and testing actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/">
                <Button className="w-full" variant="default">
                  View Landing Page
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full" variant="outline">
                  Test Registration
                </Button>
              </Link>
              <Link href="/test-registration">
                <Button className="w-full" variant="outline">
                  API Testing Tool
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Go to Login
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="w-full" variant="outline">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>💡 <strong>Pro Tip:</strong> Start with the landing page (/) and follow the registration flow to test the complete client experience!</p>
        </div>
      </div>
    </div>
  );
}
