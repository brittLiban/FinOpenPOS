# FinOpenPOS - Multi-Tenant SaaS Platform

A multi-tenant Point of Sale (POS) and Inventory Management SaaS platform built with Next.js, React, and Supabase.

## Built On
This project is based on the open source FinOpenPOS project, enhanced with multi-tenant architecture and SaaS capabilities including:

- Multi-tenant database isolation
- Stripe Connect integration with platform fees
- Subdomain-based tenant routing
- Automated company onboarding
- Enhanced security and scalability

## Original Project
Based on the open source POS system that "embraces the spirit of open-source development, making it freely available for the community to use, modify, and improve upon."

## Enhanced Features (Our Additions)

### 🏢 Multi-Tenant Architecture
- Complete tenant data isolation via company_id
- Subdomain-based routing (company.yourpos.com)
- Row-Level Security (RLS) policies
- Scalable multi-company database design

### 💳 SaaS Monetization
- Stripe Connect integration
- Automated platform fee collection
- Express account creation
- Webhook-driven payment processing

### 🚀 Automated Onboarding
- Self-service company registration
- Automatic subdomain generation
- Sample data creation
- Role-based access control setup

### 🔒 Production Security
- Enhanced authentication
- Tenant data isolation
- Secure webhook handling
- Comprehensive audit logging

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with RLS)
- **Payments**: Stripe Connect
- **Hosting**: Vercel with custom domains
- **Multi-tenancy**: Subdomain-based routing

## License

This enhanced version maintains the open source spirit while adding significant commercial SaaS capabilities. The multi-tenant architecture and Stripe integration represent substantial original development work.

---

*This project demonstrates how open source foundations can be enhanced to create commercial SaaS platforms while respecting the original project's open source nature.*
