# Production Deployment Guide for Multi-tenant FinOpenPOS

## 1. Environment Variables for Production

Create these environment variables in your hosting platform (Vercel, Netlify, etc.):

```bash
# Store name for dashboard header
NEXT_PUBLIC_STORE_NAME="FinOpenPOS"

# Supabase (same as development)
NEXT_PUBLIC_SUPABASE_URL=https://aredoqatkuospmcxdvuj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # LIVE key for production
STRIPE_WEBHOOK_SECRET=whsec_... # Production webhook secret from Stripe Dashboard
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Business defaults (can be overridden per tenant)
BUSINESS_NAME="FinOpenPOS"
NEXT_PUBLIC_BUSINESS_NAME="FinOpenPOS"
BUSINESS_ADDRESS="Your Address"
BUSINESS_PHONE="Your Phone"
BUSINESS_EMAIL="support@yourdomain.com"
```

## 2. Stripe Webhook Configuration

### A. Create Production Webhook in Stripe Dashboard:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET

### B. For Multi-tenant Stripe Connect:
Each tenant gets their own Stripe Connect account:
- Main platform account: Your main Stripe account
- Tenant accounts: Connected accounts via Stripe Connect
- Webhooks: All go to your main webhook endpoint
- Revenue split: Platform fee + tenant revenue

## 3. Multi-tenant Architecture Options

### Option A: Subdomain-based (Recommended)
```
tenant1.yourdomain.com → company_slug = "tenant1"
tenant2.yourdomain.com → company_slug = "tenant2"
```

### Option B: Single domain with company selection
```
yourdomain.com → User logs in and selects company
```

## 4. Database Multi-tenancy

Your current setup is already multi-tenant ready:
- All tables have `company_id` column
- Row Level Security (RLS) enforces tenant isolation
- Each tenant's data is completely isolated

## 5. Deployment Steps

1. **Deploy to hosting platform** (Vercel recommended for Next.js)
2. **Configure environment variables**
3. **Set up custom domain**
4. **Configure Stripe webhook** with production URL
5. **Test with Stripe test mode first**
6. **Switch to Stripe live mode**

## 6. Tenant Onboarding Process

When a new business signs up:
1. Create company record in `companies` table
2. Create user profile linked to company
3. Set up Stripe Connect account for tenant
4. Tenant completes Stripe onboarding
5. Tenant can start processing payments
```
