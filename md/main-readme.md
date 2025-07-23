# 🚀 FinOpenPOS - Enterprise Multi-Tenant POS Platform

**Production-Ready SaaS Point of Sale System**

FinOpenPOS is a comprehensive, enterprise-grade Point of Sale and Inventory Management System built as a multi-tenant SaaS platform. It enables businesses to launch their own POS service, serving multiple clients with complete data isolation, role-based permissions, and integrated payment processing.

This system represents a production-ready solution that can handle multiple businesses simultaneously, each with their own isolated environment, user management, and payment processing through Stripe Connect.

**🎯 Perfect for:** SaaS entrepreneurs, business service providers, and companies wanting to offer POS solutions to multiple clients.

## 🌟 Key Features

### 🏢 **Multi-Tenant SaaS Architecture**
- **Complete Data Isolation**: Row-level security ensures companies can't access each other's data
- **Self-Service Registration**: New businesses can sign up and get their own POS environment
- **Scalable Design**: Single deployment serves unlimited companies
- **Role-Based Access Control**: Admin, cashier, manager roles with granular permissions

### 💰 **Revenue Generation**
- **Stripe Connect Integration**: Automated payment routing to each company's account
- **Platform Fee System**: Configurable transaction fees for your revenue
- **Subscription Management**: Built-in billing and usage tracking
- **Multi-Payment Processing**: Credit cards, cash, and digital payments

### 📱 **Advanced POS Features**
- **Barcode Scanner Integration**: Camera and physical scanner support
- **Real-Time Inventory**: Automatic stock updates with low-stock alerts
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Returns & Refunds**: Full return processing with inventory restoration
- **Customer Management**: Customer profiles, order history, and analytics

### 🛠️ **Business Operations**
- **Employee Management**: Multi-role user system with permission inheritance
- **Financial Analytics**: Revenue, profit margins, expense tracking
- **Audit Logging**: Complete activity tracking for compliance
- **Multi-Language Support**: English, Spanish, Portuguese
- **Export Capabilities**: Data export for accounting and analysis

## 🏗️ Technical Architecture

### **Frontend Stack**
- **Next.js 14.2.30**: React framework with App Router and SSR
- **TypeScript**: Type-safe development throughout
- **Tailwind CSS**: Utility-first styling with responsive design
- **Shadcn/UI**: Modern component library with accessibility
- **React Hooks**: State management and lifecycle handling

### **Backend Infrastructure**
- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)**: Database-level multi-tenancy
- **Next.js API Routes**: RESTful API with TypeScript
- **Stripe Connect**: Multi-tenant payment processing
- **Real-time Subscriptions**: Live data updates across clients

### **Database Architecture**
- **PostgreSQL**: Robust relational database with ACID compliance
- **Multi-Tenant Schema**: Company-scoped data with automatic isolation
- **Optimized Indexes**: Performance-tuned for high-volume operations
- **Migration System**: Version-controlled database changes
- **Backup & Recovery**: Automated data protection

### **Security & Compliance**
- **Supabase Auth**: Enterprise-grade authentication
- **JWT Tokens**: Secure session management
- **HTTPS Everywhere**: SSL/TLS encryption for all communications
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Trails**: Complete activity logging for compliance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/bun
- Supabase account and project
- Stripe account (for payments)

### Installation
```bash
# Clone the repository
git clone https://github.com/brittLiban/FinOpenPOS.git
cd FinOpenPOS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Configuration
Create `.env.local` with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### First Company Setup
1. Navigate to `/register`
2. Create your first company account
3. Complete Stripe Connect onboarding
4. Add sample products and test the system

## 🏗️ System Architecture

### **Multi-Tenant Structure**
```
├── Company A (company_id: 1)
│   ├── Users: admin@companya.com, cashier@companya.com
│   ├── Products: 500+ items with barcodes
│   ├── Orders: Complete transaction history
│   └── Settings: Company-specific configuration
│
├── Company B (company_id: 2)
│   ├── Users: owner@companyb.com, staff@companyb.com
│   ├── Products: 200+ items with barcodes
│   ├── Orders: Separate transaction history
│   └── Settings: Independent configuration
│
└── Platform Level
    ├── User Authentication (Supabase Auth)
    ├── Payment Processing (Stripe Connect)
    ├── Database Schema (PostgreSQL with RLS)
    └── Application Logic (Next.js API Routes)
```

### **Core Application Pages**
- `/register` - Multi-tenant company registration
- `/login` - Unified authentication
- `/admin` - Company dashboard with analytics
- `/admin/checkout` - POS interface with barcode scanning
- `/admin/products` - Product catalog management
- `/admin/inventory` - Stock management and intake
- `/admin/customers` - Customer relationship management
- `/admin/orders` - Order processing and history
- `/admin/employees` - User and role management
- `/admin/settings` - Company configuration

## 🗃️ Database Schema

### **Multi-Tenant Tables**
All tables include `company_id` for perfect data isolation:

```sql
-- Core Business Tables
├── companies (id, name, slug, stripe_account_id)
├── profiles (user_id, company_id, role_id)
├── products (id, name, barcode, price, in_stock, company_id)
├── customers (id, name, email, phone, company_id)
├── orders (id, customer_id, total, status, company_id)
├── order_items (id, order_id, product_id, quantity, price)

-- User Management
├── user_roles (user_id, company_id, role_id)
├── roles (id, name, permissions)
├── sidebar_permissions (role_id, menu_item, allowed)

-- Financial Tracking
├── transactions (id, order_id, amount, type, company_id)
├── expenses (id, description, amount, category, company_id)
├── payment_methods (id, name, active, company_id)

-- Inventory Management
├── restocks (id, product_id, quantity, cost, company_id)
├── returns (id, order_id, reason, amount, company_id)
```

### **Row Level Security (RLS)**
Every table has policies ensuring companies only access their data:
```sql
-- Example policy
CREATE POLICY "Companies can only see their own data" 
ON products FOR ALL USING (company_id = get_user_company_id());
```

## 🔐 Authentication & Security

### **Multi-Level Security**
- **Database Level**: Row Level Security (RLS) prevents cross-company data access
- **API Level**: Every endpoint validates company membership
- **Frontend Level**: Company-scoped data fetching and UI rendering
- **User Level**: Role-based permissions with granular access control

### **Authentication Flow**
1. User registers/logs in via Supabase Auth
2. System identifies user's company association
3. All database queries automatically scoped to company_id
4. Role-based permissions control feature access
5. Audit logging tracks all user activities

## 💳 Payment Processing

### **Stripe Connect Multi-Tenant**
- Each company gets their own Stripe Connect account
- Platform collects configurable transaction fees
- Direct payments to merchant accounts
- Webhook processing for real-time updates
- Subscription billing ready for SaaS model

### **Supported Payment Methods**
- Credit/Debit Cards (via Stripe)
- Cash transactions
- Split payments
- Refunds and partial refunds
- Payment method preferences per company

## 📊 Business Intelligence

### **Analytics Dashboard**
- Real-time revenue tracking
- Profit margin analysis
- Inventory turnover metrics
- Customer analytics
- Employee performance tracking
- Company comparison (platform level)

### **Reporting Features**
- Daily/weekly/monthly reports
- Export to CSV/Excel
- Custom date ranges
- Category-based analysis
- Low stock alerts
- Financial summaries

## 🔧 Development & Deployment

### **Local Development**
```bash
# Development server with hot reload
npm run dev

# Build production version
npm run build

# Run production build locally
npm run start
```

### **Database Management**
```bash
# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Reset database (development only)
npm run db:reset
```

### **Production Deployment**
The system is optimized for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify** (with API routes)
- **Railway** (full-stack deployment)
- **AWS/Google Cloud** (custom deployment)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript typing
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test`
6. Submit a pull request with detailed description

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain multi-tenant data isolation
- Add comprehensive error handling
- Include audit logging for new features
- Test with multiple companies
- Document API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides in `/md` folder
- **Community**: Join our growing community of POS developers
- **Enterprise Support**: Available for production deployments

---

**🚀 Ready to launch your multi-tenant POS platform? Get started with FinOpenPOS today!**
