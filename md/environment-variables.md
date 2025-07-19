# Environment Variables Guide

Below are the required environment variables for FinOpenPOS, what they are for, and where to set them. All variables should be placed in a `.env.local` file at the root of your project.

---

## 1. Supabase
- `NEXT_PUBLIC_SUPABASE_URL`  
  *Your Supabase project URL*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  *Your Supabase anon/public API key*  
  **Set in:** `.env.local`

## 2. Stripe
- `STRIPE_SECRET_KEY`  
  *Your Stripe secret API key*  
  **Set in:** `.env.local`
- `STRIPE_WEBHOOK_SECRET`  
  *Your Stripe webhook signing secret*  
  **Set in:** `.env.local`

## 3. Site/Business Info
- `NEXT_PUBLIC_SITE_URL`  
  *Your deployed site URL (e.g., https://yourdomain.com)*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_NAME`  
  *Business name for receipts/UI*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_ADDRESS`  
  *Business address for receipts/UI*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_PHONE`  
  *Business phone for receipts/UI*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_EMAIL`  
  *Business email for receipts/UI*  
  **Set in:** `.env.local`

---

## Example `.env.local` File

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_ADDRESS=123 Main St, City, Country
NEXT_PUBLIC_BUSINESS_PHONE=123-456-7890
NEXT_PUBLIC_BUSINESS_EMAIL=info@yourbusiness.com
```

---

**Note:** Never commit your `.env.local` file to version control. Keep your secrets safe!
