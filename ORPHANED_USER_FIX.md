# How to Fix Your Orphaned User Issue

## 🚨 Current Situation
- User exists in Supabase Auth: `liban3367@ymail.com` (ID: `f7751460-90e5-4acd-9199-360877bc670d`)
- User has no company or profile in database
- Registration process partially failed

## 🔧 Step-by-Step Fix

### Step 1: Login with the Orphaned User
1. Go to `/login`
2. Enter email: `liban3367@ymail.com`
3. Enter the password you used during registration
4. Try to login

### Step 2: If Login Works
- The admin layout will automatically detect the missing company
- It will call the recovery API to fix the user
- You should get a company and profile created automatically

### Step 3: If Login Fails or Recovery Doesn't Work
You can manually fix this in the Supabase dashboard:

#### Option A: Use Supabase SQL Editor
Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Create a company for the orphaned user
INSERT INTO companies (
  name, 
  slug, 
  email, 
  business_type, 
  subscription_plan, 
  subscription_status, 
  trial_ends_at, 
  max_users, 
  max_products, 
  max_orders_per_month
) VALUES (
  'Hawa''s Business',
  'hawas-business',
  'liban3367@ymail.com',
  'retail',
  'basic',
  'trial',
  NOW() + INTERVAL '14 days',
  5,
  1000,
  500
) RETURNING id;

-- 2. Get the company ID from the result above, then create profile
-- Replace 'COMPANY_ID_HERE' with the actual ID returned from step 1
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  company_id
) VALUES (
  'f7751460-90e5-4acd-9199-360877bc670d',
  'liban3367@ymail.com',
  'Hawa',
  'Aden',
  'COMPANY_ID_HERE'  -- Replace with actual company ID
);

-- 3. Add user to company_users table
INSERT INTO company_users (
  user_id,
  company_id,
  role,
  status
) VALUES (
  'f7751460-90e5-4acd-9199-360877bc670d',
  'COMPANY_ID_HERE',  -- Replace with actual company ID
  'owner',
  'active'
);
```

#### Option B: Use the Test Registration Tool
1. Go to `/test-registration`
2. Use different email address to create a working company
3. Test the flow with a fresh account

## 🎯 Quick Test Steps

### Test the Auto-Recovery
1. **Login** as the orphaned user at `/login`
2. **Check admin access** by going to `/admin`
3. **If it works** → Great! The auto-recovery fixed it
4. **If it doesn't work** → Use the SQL fix above

### Verify Recovery Worked
1. Go to `/admin/products` → Should see sample products
2. Go to `/admin/customers` → Should see sample customer
3. Go to `/admin/settings` → Should see company settings

## 🚀 Future Prevention

This issue is now prevented by:
- Better error handling in registration
- Auto-recovery system in admin layout
- Graceful handling of partial registration failures

## 💡 Alternative: Start Fresh

If you want to start completely fresh:
1. Go to `/test-registration`
2. Use a new email address
3. Test the complete flow
4. This will create a clean, working company setup

## 🔍 Debug Information

The orphaned user has:
- ✅ Supabase Auth account created
- ❌ No company record
- ❌ No profile record  
- ❌ No admin roles assigned

The auto-recovery system should create all missing pieces automatically when they try to access the admin area.

---

**Try logging in first - the system should auto-fix the user! If not, use the SQL commands above.**
