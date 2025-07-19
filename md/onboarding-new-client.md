# Onboarding a New Client: Checklist & Guide

This guide explains how to set up a new client with FinOpenPOS, what information to collect, and how to configure the required environment variables.

## 1. Information to Collect

- **Business Details:**
  - Business name, address, contact info
  - Tax ID or business registration number
- **Primary Contact:**
  - Name, email, phone number
- **User Accounts:**
  - List of employees (names, emails, roles)
  - Assign admin and cashier roles as needed
- **Inventory Data:**
  - Product list (name, SKU, price, quantity, category)
  - Initial stock levels
- **Payment Setup:**
  - Stripe account details (API keys)
  - Bank account for payouts
- **Localization Preferences:**
  - Preferred language(s)
  - Currency and tax settings

## 2. Setting Up a New Client

1. **Create a Supabase Project:**
   - Set up a new Supabase project for the client or create a new schema in an existing instance.
2. **Configure Environment Variables:**
   - Copy the example from [environment-variables.md](./environment-variables.md) to a `.env.local` file in your project root.
   - Fill in Supabase and Stripe credentials, and business info.
3. **Set Up Database:**
   - Run `schema.sql` to create tables in your PostgreSQL instance.
   - (Optional) Run `seed-roles.sql` to initialize user roles.
4. **Import Inventory:**
   - Use the admin dashboard or a script to import the product list.
5. **Add Users:**
   - Register employees and assign roles via the admin panel.
6. **Test Payments:**
   - Connect Stripe and run a test transaction.
7. **Customize Settings:**
   - Set language, currency, and tax preferences in the admin settings.
8. **Training:**
   - Provide training to staff on using the POS, managing inventory, and processing sales/returns.

## 3. Go Live

- Confirm all data is correct and payments are working.
- Provide support contact for troubleshooting.
- Schedule a follow-up to ensure client satisfaction.

---

For more details, see the main [README](./README.md), [How It Works](./how-it-works.md), and [Environment Variables](./environment-variables.md).
