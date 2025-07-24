# YourPOS - Multi-Tenant SaaS Platform

> **Transform your POS business into a scalable SaaS platform where multiple companies can run their own isolated POS systems under your brand.**

A complete multi-tenant Point of Sale (POS) and Inventory Management SaaS platform built with Next.js, React, and Supabase. This enhanced version adds sophisticated multi-tenant architecture, Stripe Connect integration, and automated tenant onboarding to create a production-ready SaaS business.

## 🚀 Multi-Tenant SaaS Features

### **🏢 Complete Tenant Isolation**
- **Subdomain-based Architecture**: Each company gets `company.yourpos.com`
- **Database Isolation**: Row-Level Security ensures zero data leakage
- **Automated Onboarding**: Self-service company registration with sample data
- **Role Management**: Complete RBAC system per tenant

### **💳 Built-in Monetization** 
- **Stripe Connect Integration**: Automatic platform fee collection (2.5% default)
- **Express Account Creation**: Streamlined payment setup for tenants
- **Webhook Automation**: Real-time payment processing and account updates
- **Revenue Dashboard**: Track platform earnings across all tenants

### **🔒 Production-Ready Security**
- **Enhanced RLS Policies**: Bulletproof tenant data separation
- **Secure Webhook Handling**: Verified Stripe event processing
- **Audit Logging**: Complete activity tracking per company
- **Multi-Factor Auth**: Enterprise-grade security

## Original POS Features

- **Dashboard**: Overview of key metrics and charts
- **Products Management**: Add, edit, delete, and view products with barcode support
- **Customer Management**: Manage customer information and status
- **Order Management**: Create and manage orders with real-time inventory updates
- **Point of Sale (POS)**: Quick and easy sales processing with Stripe payments
- **User Authentication**: Secure login system with role-based access

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS  
- **Backend**: Supabase PostgreSQL with Row-Level Security
- **Payments**: Stripe Connect with platform fees
- **Multi-tenancy**: Subdomain-based routing with tenant isolation
- **Hosting**: Vercel with custom domain support
- **UI Components**: Shadcn UI components
- **Charts**: Recharts for analytics

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/brittLiban/YourPOS-Platform.git
cd YourPOS-Platform
npm install
```

### 2. Environment Configuration
```env
# Multi-tenant domain
NEXT_PUBLIC_TENANT_DOMAIN=yourpos.com
NEXT_PUBLIC_APP_URL=https://yourpos.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Connect
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENTAGE=2.5
```

### 3. Database Setup
```sql
-- Run the migrations in order:
-- 1. migrations/create-companies-system.sql
-- 2. migrations/2025-07-23-add-multitenant-fields.sql
-- 3. Set up Row-Level Security policies
```

### 4. Deploy
```bash
npm run build
vercel deploy --prod
```

## 🏗 Architecture

```
Platform Domain (yourpos.com)
├── Registration: yourpos.com/register
├── Tenant 1: company1.yourpos.com  
├── Tenant 2: company2.yourpos.com
└── Admin: admin.yourpos.com

Each tenant gets:
✅ Complete POS system
✅ Isolated database access  
✅ Stripe Connect account
✅ Custom subdomain
✅ Role-based team management
```

## 💰 Revenue Model

Your platform earns money through:
- **Platform Fees**: 2.5% of all tenant transactions (configurable)
- **Subscription Plans**: Monthly/annual tenant fees (optional)
- **Setup Fees**: One-time onboarding charges (optional)

## 🔐 Multi-Tenant Security

- **Database Isolation**: Row-Level Security with `company_id` filtering
- **Subdomain Routing**: Complete tenant separation
- **Stripe Connect**: Isolated payment processing per tenant
- **Role-Based Access**: Granular permissions per company
- **Audit Logging**: Complete activity tracking

## 📊 Database Schema

Enhanced multi-tenant schema with:

### Core Tables
- `companies`: Tenant organizations with Stripe accounts
- `profiles`: Users linked to companies  
- `products`: Tenant-isolated inventory
- `orders`: Tenant-isolated transaction records
- `roles`: Company-specific user roles
- `sidebar_permissions`: Granular access control

### Multi-Tenant Features
- All tables include `company_id` for isolation
- RLS policies enforce tenant boundaries
- Automatic subdomain generation
- Stripe Connect account management

## 🎯 For Tenants (Your Customers)

Each company that registers gets:
- **Professional Subdomain**: `theircompany.yourpos.com`
- **Complete POS System**: Inventory, sales, reporting, team management
- **Stripe Integration**: Accept payments immediately after onboarding
- **Sample Data**: Ready-to-use products and categories
- **Role Management**: Add employees with different permission levels
- **Data Privacy**: Complete isolation from other tenants

## 📄 License

This project is licensed under a **Commercial-Friendly License** - see the [LICENSE](LICENSE) file for details.

### License Summary:
- ✅ **Use freely** for personal, educational, or single-company internal use
- ✅ **Modify and study** the multi-tenant architecture  
- ✅ **Contribute** improvements back to the community
- ❌ **Commercial SaaS deployment** requires separate licensing
- ❌ **White-label distribution** not permitted without permission

### Commercial Licensing Available
The multi-tenant architecture, Stripe Connect integration, and automated tenant onboarding represent substantial original innovation. For commercial SaaS platform deployment or white-label distribution, contact us for commercial licensing options.

**This license protects your business while encouraging community learning and contributions.**

## 🤝 Contributing

We welcome contributions that improve the platform! Please:

1. **Fork the repository**
2. **Create a feature branch** 
3. **Make your improvements**
4. **Add tests** if applicable
5. **Submit a pull request**

By contributing, you agree that your contributions will be licensed under the same terms.

## 📧 Support & Contact

- **Issues**: GitHub Issues for bug reports and feature requests
- **Commercial Licensing**: Contact for SaaS deployment licensing
- **Community**: Discussions and Q&A

---

**Ready to build the next big POS SaaS platform?** 🚀

*Transform a single POS system into a multi-million dollar SaaS business with built-in multi-tenancy and revenue collection.*
