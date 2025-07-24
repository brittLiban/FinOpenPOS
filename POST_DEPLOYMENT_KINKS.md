# 🎯 Post-Deployment Kinks to Watch For

## Common Production Issues & Quick Fixes

### 🌐 DNS & Subdomain Issues
**Problem**: Subdomains not routing correctly
**Solution**: 
```javascript
// Test in browser console:
console.log(window.location.hostname);
// Should show: company.yourpos.com
```
**Fix**: Check Vercel domain settings and middleware.ts

### 💳 Stripe Live Mode Differences
**Problem**: Stripe Connect behaves differently in live mode
**Watch For**:
- Longer approval times for Express accounts
- Different country requirements
- More strict business verification

**Quick Fix**: 
```bash
# Test with Stripe CLI
stripe listen --forward-to https://yourpos.com/api/webhooks
```

### 🔒 CORS & Security Issues
**Problem**: Browser blocking requests between subdomains
**Solution**: Update `next.config.mjs`:
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*.yourpos.com' },
      ],
    },
  ];
}
```

### 📊 Database Performance
**Problem**: Slow queries with multiple tenants
**Monitor**: Supabase dashboard for slow queries
**Fix**: Add indexes if needed:
```sql
CREATE INDEX IF NOT EXISTS idx_products_company_sku ON products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_orders_company_date ON orders(company_id, created_at);
```

### 🎣 Webhook Issues
**Problem**: Webhooks not firing or failing
**Debug Steps**:
1. Check Stripe webhook logs
2. Verify endpoint returns 200
3. Test payload parsing

**Emergency Fix**:
```javascript
// Add to webhook route temporarily
console.log('Webhook received:', event.type, event.id);
```

## Quick Smoke Tests After Deployment

### Test 1: Basic Registration (2 min)
```bash
curl -X POST https://yourpos.com/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Co","ownerEmail":"test@test.com","ownerUserId":"test123"}'
```

### Test 2: Subdomain Resolution (1 min)
```bash
nslookup testco.yourpos.com
# Should resolve to your server
```

### Test 3: Database Isolation (3 min)
1. Register Company A
2. Register Company B  
3. Login as Company A
4. Verify can't see Company B's data

## Production Monitoring Setup

### Set Up Alerts
```javascript
// Add to your webhook handler
if (error) {
  // Send alert to your email/Slack
  console.error('PRODUCTION ERROR:', error);
}
```

### Key Metrics to Watch
- **Registration completion rate**
- **Stripe onboarding completion rate** 
- **Platform fee collection**
- **Database query performance**
- **Subdomain DNS resolution time**

## Emergency Rollback Plan

If something breaks badly:

1. **Quick Fix**: Point DNS back to old system
2. **Database**: Your RLS policies protect data integrity
3. **Stripe**: Payments continue working independently
4. **Users**: Can still access via direct company URLs

## Most Likely "Kinks"

1. **SSL Certificate Issues**: Vercel handles this, but may take time
2. **Subdomain Cookie Issues**: Users may need to clear cookies
3. **Stripe Account Approval Delays**: Normal in production
4. **DNS Propagation**: Can take 24-48 hours globally

## The Good News

Your architecture is solid:
- ✅ **Data is protected** by RLS policies
- ✅ **Payments work independently** per tenant
- ✅ **Users can't break other tenants**
- ✅ **Easy to debug** with clear tenant separation

## Go Live Strategy

**Recommended Approach:**
1. Deploy to production domain
2. Test with 1-2 fake companies
3. Invite beta users (friends/family)
4. Fix any issues found
5. Open to public

You've built a robust system - most "kinks" will be minor configuration issues, not architectural problems!

Ready to deploy? 🚀
