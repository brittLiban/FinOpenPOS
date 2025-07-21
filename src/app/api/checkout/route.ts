import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { stripeConnect } from "@/lib/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  // Helper for audit logging
  const logCheckoutAudit = async (actionType: string, details: any) => {
    const { logAudit } = await import("@/lib/log-audit");
    // No user context here, so userId is null
    await logAudit({
      userId: null,
      actionType,
      entityType: 'checkout',
      details
    });
  };
  
  const domain = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const body = await req.json();

  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    // Get authenticated user and their company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company and Stripe account info
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('stripe_account_id, stripe_charges_enabled, platform_fee_percent, name')
      .eq('id', profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if company has completed Stripe onboarding
    if (!company.stripe_account_id || !company.stripe_charges_enabled) {
      return NextResponse.json({ 
        error: 'Stripe account not set up. Please complete onboarding first.',
        needsOnboarding: true
      }, { status: 400 });
    }

    // Step 1: Fetch stripe_price_ids from Supabase for each product
    const productIds = body.items.map((item: any) => item.id);

    const { data: products, error } = await adminSupabase
      .from("products")
      .select("id, stripe_price_id")
      .in("id", productIds)
      .eq("company_id", profile.company_id); // Ensure multi-tenant isolation

    if (error || !products) {
      console.error("❌ Failed to fetch products from Supabase", error);
      await logCheckoutAudit('checkout_failed', { reason: 'Could not fetch products', error });
      return NextResponse.json({ error: "Could not fetch products" }, { status: 500 });
    }

    // Calculate discount and tax (apply discount directly to product prices)
    let discountPercent = body.discountPercent && body.discountPercent > 0 ? Number(body.discountPercent) : 0;
    // Fetch tax rate from settings for this company
    let taxRate = 0;
    let taxAmount = 0;
    const { data: settings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", "tax_rate")
      .eq("company_id", profile.company_id) // Company-specific tax rate
      .single();
    
    if (settings && settings.value) {
      taxRate = Number(settings.value);
    }

    // Step 2: Build line items using stripe_price_id, applying discount directly
    let line_items = body.items.map((item: any) => {
      const matchedProduct = products.find((p) => p.id === item.id);
      if (!matchedProduct?.stripe_price_id) {
        throw new Error(`Missing stripe_price_id for product ${item.id}`);
      }
      // Apply discount to price
      const discountedPrice = item.price * (1 - discountPercent / 100);
      return {
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(discountedPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    // Calculate subtotal after discount for tax and platform fee
    const subtotalAfterDiscount = body.items.reduce((sum: number, item: any) => sum + (item.price * (1 - discountPercent / 100) * item.quantity), 0);
    
    // Add tax if applicable
    if (taxRate > 0) {
      taxAmount = (subtotalAfterDiscount * taxRate) / 100;
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Tax (${taxRate.toFixed(2)}%)` },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Calculate platform fee (applied to total including tax)
    const totalAmount = subtotalAfterDiscount + taxAmount;
    const platformFeePercent = company.platform_fee_percent || 2.5;
    const applicationFeeAmount = Math.round((totalAmount * platformFeePercent / 100) * 100); // Convert to cents

    // Step 3: Create checkout session with Stripe Connect
    const session = await stripeConnect.createCheckoutSession({
      line_items,
      accountId: company.stripe_account_id,
      applicationFeeAmount,
      success_url: `${domain}/admin/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/admin/checkout/cancel`,
      metadata: {
        company_id: profile.company_id,
        company_name: company.name,
        discount_percent: discountPercent ? discountPercent.toFixed(2) : "0",
        tax_rate: taxRate ? taxRate.toFixed(2) : "0",
        tax_amount: taxAmount ? taxAmount.toFixed(2) : "0",
        platform_fee_percent: platformFeePercent.toFixed(2),
        platform_fee_amount: (applicationFeeAmount / 100).toFixed(2),
      },
    });

    await logCheckoutAudit('checkout', { 
      items: body.items, 
      sessionId: session.id, 
      url: session.url,
      companyId: profile.company_id,
      stripeAccountId: company.stripe_account_id,
      platformFee: applicationFeeAmount / 100
    });
    
    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("❌ Stripe Connect checkout error", err);
    await logCheckoutAudit('checkout_failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
