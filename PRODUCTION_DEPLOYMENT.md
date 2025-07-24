# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

### ✅ What You've Built (Ready for Production):
- ✅ Multi-tenant database schema with RLS
- ✅ Stripe Connect integration with platform fees
- ✅ Subdomain-based tenant routing
- ✅ Enhanced registration with auto-onboarding
- ✅ Webhook handling for payments and account updates
- ✅ Complete role-based access control
- ✅ Tenant data isolation

## Step 1: Domain & DNS Setup

### 1.1 Purchase Your Domain
- Buy your domain (e.g., `yourpos.com`)

### 1.2 Configure DNS
Add these DNS records:
```
Type: A
Name: @
Value: [Your hosting provider's IP]
TTL: 300

Type: CNAME  
Name: *
Value: yourpos.com
TTL: 300

Type: CNAME
Name: www
Value: yourpos.com
TTL: 300
```

The wildcard `*` record enables all subdomains like `company1.yourpos.com`

## Step 2: Environment Variables for Production

Update your `.env.local` for production:

```env
# Production Domain
NEXT_PUBLIC_TENANT_DOMAIN=yourpos.com
NEXT_PUBLIC_APP_URL=https://yourpos.com
NEXT_PUBLIC_SITE_URL=https://yourpos.com

# Stripe LIVE Keys (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (create new for production)

# Keep your existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=https://aredoqatkuospmcxdvuj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Platform Settings
PLATFORM_FEE_PERCENTAGE=2.5
NEXT_PUBLIC_PLATFORM_NAME="YourPOS"
```

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub
```bash
git add .
git commit -m "Multi-tenant production ready"
git push origin main
```

### 3.2 Deploy to Vercel
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Set custom domain: `yourpos.com`
4. Deploy!

### 3.3 Configure Vercel for Subdomains
In `vercel.json`:
```json
{
  "functions": {
    "app/**/*": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/app/$1"
    }
  ]
}
```

## Step 4: Stripe Production Setup

### 4.1 Create Live Webhook Endpoint
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourpos.com/api/webhooks`
3. Select events:
   - `checkout.session.completed`
   - `account.updated`
4. Copy webhook secret to environment variables

### 4.2 Test Stripe Connect
1. Create a test company via registration
2. Complete Stripe onboarding
3. Process a test transaction
4. Verify platform fee collection

## Step 5: Test Production Flow

### 5.1 Test Registration
1. Go to `https://yourpos.com/register`
2. Register "Test Coffee Shop"
3. Should get subdomain: `test-coffee-shop.yourpos.com`
4. Complete Stripe onboarding

### 5.2 Test Multi-Tenancy
1. Register second company
2. Verify different subdomain
3. Check data isolation
4. Test POS functionality

### 5.3 Test Payments
1. Create products in POS
2. Process test order
3. Verify webhook receives payment
4. Check platform fee deduction

## Step 6: Monitor & Debug

### 6.1 Common Issues & Solutions

**DNS not propagating:**
- Wait 24-48 hours for full propagation
- Test with `nslookup yourpos.com`

**Subdomain routing not working:**
- Check middleware.ts is properly handling subdomains
- Verify Vercel wildcard domain configuration

**Stripe webhooks failing:**
- Check webhook endpoint responds 200
- Verify webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to yourpos.com/api/webhooks`

**Database permissions:**
- Verify RLS policies allow cross-tenant access where needed
- Check company_id is properly set in all queries

### 6.2 Monitoring Tools
- **Vercel Analytics**: Track page loads and errors
- **Stripe Dashboard**: Monitor payments and Connect accounts
- **Supabase Logs**: Database query performance
- **Your Browser DevTools**: Frontend errors

## Step 7: Customer Onboarding

### 7.1 Marketing Page (Optional)
Create landing page at `yourpos.com` explaining:
- Multi-tenant POS benefits
- Pricing (your platform fee)
- Link to registration

### 7.2 Support Documentation
- Registration guide
- Stripe setup instructions
- POS user manual
- Troubleshooting guide

## Expected Production Flow

### For New Customers:
1. Visit `yourpos.com/register`
2. Fill registration form
3. Get instant subdomain: `theircompany.yourpos.com`
4. Complete Stripe onboarding
5. Start using POS immediately
6. You earn platform fees on all transactions

### For You (Platform Owner):
1. Automatic revenue via platform fees
2. Scalable tenant management
3. Zero manual setup per customer
4. Complete business data insights

## Ready to Deploy? 

Your system is production-ready! The main things to watch for:
1. **DNS propagation** (takes time)
2. **Stripe live mode** (different behavior than test)
3. **Subdomain routing** (verify with test companies)
4. **Database performance** (monitor Supabase usage)

After deployment, create 2-3 test companies to verify everything works, then you're ready to start acquiring customers!

Would you like me to help with any specific deployment step?
