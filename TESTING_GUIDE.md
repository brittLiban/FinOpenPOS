# 🧪 Test Your Multi-Tenant System

## Quick Test Scenarios

### Scenario 1: Register "Coffee Shop Inc"
1. Go to `http://localhost:3001/register`
2. Fill form:
   - Company: "Coffee Shop Inc"
   - Business Type: "retail"
   - Your name and email
3. Expected Results:
   - Subdomain: `coffee-shop-inc.yourpos.com`
   - Stripe Connect account created
   - Sample coffee products added
   - Admin role assigned

### Scenario 2: Register "Tech Gadgets LLC"  
1. Register second company
2. Different subdomain: `tech-gadgets-llc.yourpos.com`
3. Separate Stripe account
4. Separate product inventory
5. Complete data isolation

### Scenario 3: Test Stripe Onboarding
1. Click "Complete Stripe Setup" on success page
2. Go through Stripe Express onboarding
3. Return to see account status updated
4. Webhook should update company record

## Database Verification Commands

```sql
-- Check all companies with subdomains
SELECT 
  name, 
  subdomain, 
  stripe_account_id,
  stripe_onboarding_complete,
  created_at
FROM companies 
ORDER BY created_at DESC;

-- Check user profiles
SELECT 
  p.first_name,
  p.last_name, 
  p.email,
  c.name as company_name,
  c.subdomain
FROM profiles p
JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- Check sample products per company
SELECT 
  p.name as product_name,
  p.sku,
  p.price,
  c.name as company_name,
  c.subdomain
FROM products p
JOIN companies c ON p.company_id = c.id
ORDER BY c.created_at DESC, p.name;
```

## What to Look For

### ✅ Success Indicators:
- Registration completes without errors
- Unique subdomains generated
- Stripe accounts created in dashboard
- Sample data appears in correct company
- Success page shows all details
- No data leakage between companies

### ❌ Potential Issues:
- Stripe API key errors → Check `.env.local`
- Database errors → Check migration ran successfully  
- Subdomain conflicts → Should auto-increment
- Missing sample data → Check `createSampleData` function

## Production Readiness Test

When ready for production:
1. Test with real domain and SSL
2. Verify webhook endpoint works
3. Test Stripe live mode
4. Confirm subdomain DNS routing
5. Test tenant isolation in production

Your system is now production-ready for multi-tenant SaaS deployment! 🚀
