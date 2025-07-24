# Multi-Tenant Domain Strategy Implementation Guide

## 🌐 Option 1: Subdomain-Based Multi-Tenancy (RECOMMENDED)

### How it works:
- `tenant1.yourpos.com` → Company 1
- `tenant2.yourpos.com` → Company 2
- `admin.yourpos.com` → Platform admin
- `app.yourpos.com` → Main app (optional)

### Setup Steps:

#### 1. DNS Configuration
```
# Add these DNS records to your domain:
Type: CNAME
Name: *
Value: yourpos.com
TTL: 300

# This creates a wildcard subdomain pointing to your main domain
```

#### 2. Update your middleware.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Skip for main domain and admin
  if (subdomain === 'www' || subdomain === 'admin' || !subdomain.includes('.')) {
    return NextResponse.next();
  }
  
  // Add subdomain as company identifier
  const url = request.nextUrl.clone();
  url.searchParams.set('tenant', subdomain);
  
  return NextResponse.rewrite(url);
}
```

#### 3. Update your auth and API logic
```typescript
// In your auth helpers
export function getCompanyFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const subdomain = hostname.split('.')[0];
  
  // Map subdomain to company_id
  return subdomain;
}
```

### Pros:
- ✅ Clean separation
- ✅ Easy to scale
- ✅ Professional look
- ✅ Better SEO per tenant

### Cons:
- ❌ More complex DNS setup
- ❌ SSL certificate for wildcards

---

## 🌐 Option 2: Path-Based Multi-Tenancy

### How it works:
- `yourpos.com/tenant1/dashboard`
- `yourpos.com/tenant2/products`
- `yourpos.com/admin` → Platform admin

### Setup Steps:

#### 1. Update your app structure
```
app/
  [tenant]/
    dashboard/
    products/
    checkout/
  admin/
  api/
    [tenant]/
```

#### 2. Update middleware
```typescript
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');
  const tenant = segments[1];
  
  if (tenant && tenant !== 'api' && tenant !== 'admin') {
    // Add tenant to context
    request.nextUrl.searchParams.set('tenant', tenant);
  }
  
  return NextResponse.next();
}
```

### Pros:
- ✅ Simple DNS (one domain)
- ✅ Easy SSL
- ✅ Simple deployment

### Cons:
- ❌ Less professional URLs
- ❌ Tenant leakage in paths

---

## 🌐 Option 3: Single Domain with Tenant Selection

### How it works:
- User logs in → redirected to tenant dashboard
- `yourpos.com/dashboard` (shows current tenant)
- Tenant switching via dropdown/menu

### Implementation:
- Store selected tenant in session/cookie
- Use tenant context throughout app
- Add tenant switcher in nav

### Pros:
- ✅ Simplest setup
- ✅ One domain to manage
- ✅ Easy user switching

### Cons:
- ❌ No tenant branding in URL
- ❌ Harder to share tenant-specific links

---

## 🚀 Production Deployment Steps

### 1. Choose Your Strategy
**Recommendation:** Go with **subdomain-based** for maximum scalability and professional appearance.

### 2. Update Environment Variables
```env
# Production
NEXT_PUBLIC_APP_URL=https://yourpos.com
NEXT_PUBLIC_SITE_URL=https://yourpos.com

# Wildcard domain for subdomains
NEXT_PUBLIC_TENANT_DOMAIN=yourpos.com

# Stripe Production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Update Stripe Webhook URL
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://yourpos.com/api/webhooks`
- Select events: `checkout.session.completed`, `account.updated`

### 4. Deploy to Vercel/Production
```bash
# Deploy
vercel --prod

# Or with environment
vercel --prod --env STRIPE_SECRET_KEY=sk_live_...
```

### 5. Set up tenant onboarding flow
```typescript
// When new company signs up:
1. Create company record
2. Create Stripe Connect account
3. Assign subdomain (company.slug)
4. Send welcome email with subdomain
```

## 📋 Next Steps Checklist

- [ ] Choose multi-tenant strategy
- [ ] Purchase domain
- [ ] Set up DNS (if subdomain approach)
- [ ] Update middleware for chosen strategy
- [ ] Set up production Stripe webhooks
- [ ] Test with live Stripe keys
- [ ] Deploy to production
- [ ] Create tenant onboarding flow

## 🤔 Which approach do you prefer?

Based on your SaaS model, I'd recommend **subdomain-based** because:
- Professional appearance
- Better tenant isolation
- Easier to scale
- Each tenant feels like they have their own platform
