# Onboarding a New Client: Multi-Tenant SaaS Guide

This guide explains how to onboard a new client with your multi-tenant FinOpenPOS SaaS platform, including Stripe Connect setup for payment processing.

## 🚀 Quick Overview

With the multi-tenant architecture, each client gets:
- ✅ Their own isolated company workspace
- ✅ Individual Stripe Connect account for payments  
- ✅ Separate product inventory and sales data
- ✅ Custom tax rates and business settings
- ✅ Platform fee revenue for you (default 2.5%)

## 📋 Step-by-Step Client Onboarding

### 1. **Client Registration**
Send your client to: `https://yourapp.com/register`

**They need to provide:**
- Business name
- Primary contact email
- Admin user details (first name, last name)
- Password for their admin account

**What happens automatically:**
- New company record created
- Admin user profile created  
- Company ownership assigned
- Default permissions set up

### 2. **Business Information Setup**
**Client completes in their admin dashboard:**
- Business address and contact details
- Tax ID/business registration number
- Preferred currency and language
- Custom tax rate (if different from default)

### 3. **Stripe Connect Onboarding**
**Critical for payment processing:**

1. Client goes to `/admin/settings/stripe`
2. Clicks "Start Stripe Onboarding"
3. Completes Stripe Express account setup:
   - Business verification
   - Bank account details
   - Identity verification
4. Returns to platform when complete

**Platform gets:**
- 2.5% fee on all transactions (configurable per client)
- Automatic revenue from their sales

### 4. **Inventory Setup**
**Client adds their products:**
- Go to `/admin/products`
- Add products with prices, SKUs, descriptions
- Products automatically sync to their Stripe account
- Set stock levels and categories

### 5. **Team Management**
**Add employees and assign roles:**
- Go to `/admin/employees` 
- Add staff members with appropriate permissions
- Assign cashier/manager roles as needed
- Send login credentials to team members

### 6. **Settings Configuration**
**Customize business settings:**
- Tax rates and discount policies
- Receipt customization
- Inventory alerts and thresholds
- Language and localization preferences

### 7. **Testing & Go Live**
**Before going live:**
- Process test transactions
- Verify Stripe payments work correctly
- Check inventory tracking
- Test employee access levels
- Confirm receipt generation

## 💰 Revenue Model

**Every transaction generates platform revenue:**
- Customer pays $100
- Client receives $97.50 (minus 2.5% platform fee)
- Platform receives $2.50 automatically

**Fee structure is configurable per client in database:**
```sql
UPDATE companies 
SET platform_fee_percent = 3.0 
WHERE id = 'client-company-id';
```

## 🛠️ Technical Setup (Your Side)

### One-Time Platform Setup:
1. **Stripe Account**: Your main Stripe account configured for Connect
2. **Database**: Single Supabase instance with multi-tenant schema
3. **Environment Variables**: Single `.env.local` with your platform credentials

### Per-Client Setup (Automated):
- Company record in `companies` table
- Stripe Connect account creation via API
- Automatic data isolation via RLS policies
- Webhook processing with company identification

## 📞 Support & Troubleshooting

**Common onboarding issues:**

1. **Stripe onboarding fails**
   - Check business verification requirements
   - Ensure valid bank account details
   - Verify identity documents are clear

2. **Products not syncing to Stripe**
   - Confirm Stripe onboarding is complete
   - Check product API endpoints
   - Verify company has `stripe_account_id`

3. **Permission errors**
   - Run `/fix-permissions` utility
   - Check user has proper company association
   - Verify admin role assignment

## 🎯 Success Metrics

**Track client onboarding success:**
- Time from registration to first sale
- Stripe onboarding completion rate  
- Product inventory setup completion
- Employee activation rates
- Platform fee revenue generation

## 📋 Onboarding Checklist

- [ ] Client registered and verified email
- [ ] Company profile completed
- [ ] Stripe Connect onboarding finished
- [ ] First products added and synced
- [ ] Team members added with roles
- [ ] Tax settings configured
- [ ] Test transaction processed successfully
- [ ] Client trained on basic operations
- [ ] Go-live date scheduled
- [ ] Support contact provided

---

**Next Steps:** See [How It Works](./how-it-works.md) for technical details and [Environment Variables](./environment-variables.md) for configuration.

---

For more details, see the main [README](./README.md), [How It Works](./how-it-works.md), and [Environment Variables](./environment-variables.md).
