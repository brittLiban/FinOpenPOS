import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { stripeConnect } from "@/lib/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});



export async function POST(req: NextRequest) {
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

    // Helper for audit logging with proper company_id
    const logCheckoutAudit = async (actionType: string, details: any) => {
      const { logAudit } = await import("@/lib/log-audit");
      await logAudit({
        userId: user.id,
        actionType,
        entityType: 'checkout',
        details,
        companyId: profile.company_id
      });
    };

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

    // Check if any products are missing Stripe price IDs
    const missingStripeIds = products.filter(p => !p.stripe_price_id);
    
    if (missingStripeIds.length > 0) {
      console.log(`⚠️ Found ${missingStripeIds.length} products missing Stripe IDs. Auto-syncing...`);
      
      // Attempt auto-sync
      try {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-products`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('authorization') || '',
            'Cookie': req.headers.get('cookie') || '',
          },
        });
        
        if (syncResponse.ok) {
          console.log('✅ Auto-sync completed. Refetching products...');
          
          // Refetch products with updated Stripe IDs
          const { data: updatedProducts, error: refetchError } = await adminSupabase
            .from("products")
            .select("id, stripe_price_id")
            .in("id", productIds)
            .eq("company_id", profile.company_id);
            
          if (!refetchError && updatedProducts) {
            // Replace products array with updated data
            for (let i = 0; i < products.length; i++) {
              const updated = updatedProducts.find(up => up.id === products[i].id);
              if (updated) {
                products[i] = updated;
              }
            }
          }
        }
      } catch (syncError) {
        console.error('❌ Auto-sync failed:', syncError);
      }
    }

    // Step 2: Build line items using stripe_price_id, applying discount directly
    let line_items = body.items.map((item: any) => {
      const matchedProduct = products.find((p) => p.id === item.id);
      if (!matchedProduct?.stripe_price_id) {
        throw new Error(`Missing stripe_price_id for product ${item.id}. Please complete Stripe setup and sync products.`);
      }
      // Apply discount to price
      const discountedPrice = item.price * (1 - discountPercent / 100);
      return {
        price_data: {
          currency: "usd",
          product_data: { 
            name: item.name,
            metadata: { 
              product_id: item.id.toString() // Add product_id to metadata
            }
          },
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
        user_uid: user.id, // Add user who initiated checkout
        discount_percent: discountPercent ? discountPercent.toFixed(2) : "0",
        tax_rate: taxRate ? taxRate.toFixed(2) : "0",
        tax_amount: taxAmount ? taxAmount.toFixed(2) : "0",
        platform_fee_percent: platformFeePercent.toFixed(2),
        platform_fee_amount: (applicationFeeAmount / 100).toFixed(2),
      },
    });

    // Record transaction in database for cashier tracking
    // Create a useful description with items purchased
    const itemsSummary = body.items.map((item: any) => 
      `${item.quantity}x ${item.name}`
    ).join(', ');
    
    const businessAmount = (totalAmount - applicationFeeAmount) / 100; // What business actually receives
    
    const description = body.items.length === 1 
      ? `${body.items[0].quantity}x ${body.items[0].name} - $${businessAmount.toFixed(2)}`
      : `${body.items.length} items (${itemsSummary}) - $${businessAmount.toFixed(2)}`;

    await supabase.from('transactions').insert({
      description,
      category: 'stripe_checkout',
      amount: businessAmount, // Business receives this amount (after platform fee)
      type: 'income',
      status: 'pending', // Will be updated to completed via webhook
      user_uid: user.id,
      stripe_session_id: session.id, // Store session ID for webhook updates
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
    
    // Log error audit if we have user context
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.company_id) {
          const { logAudit } = await import("@/lib/log-audit");
          await logAudit({
            userId: user.id,
            actionType: 'checkout_failed',
            entityType: 'checkout',
            details: { error: err.message },
            companyId: profile.company_id
          });
        }
      }
    } catch (auditErr) {
      console.warn("Failed to log checkout error audit:", auditErr);
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
