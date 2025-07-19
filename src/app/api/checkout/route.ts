// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";

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

  const supabase = createAdminClient();

  try {
    // Step 1: Fetch stripe_price_ids from Supabase for each product
    const productIds = body.items.map((item: any) => item.id);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, stripe_price_id")
      .in("id", productIds);

    if (error || !products) {
      console.error("❌ Failed to fetch products from Supabase", error);
      await logCheckoutAudit('checkout_failed', { reason: 'Could not fetch products', error });
      return NextResponse.json({ error: "Could not fetch products" }, { status: 500 });
    }


    // Calculate discount and tax (apply discount directly to product prices)
    let discountPercent = body.discountPercent && body.discountPercent > 0 ? Number(body.discountPercent) : 0;
    // Fetch tax rate from settings
    let taxRate = 0;
    let taxAmount = 0;
    const { data: settings } = await supabase.from("settings").select("value").eq("key", "tax_rate").single();
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

    // Calculate subtotal after discount for tax
    const subtotalAfterDiscount = body.items.reduce((sum: number, item: any) => sum + (item.price * (1 - discountPercent / 100) * item.quantity), 0);
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

    // Step 3: Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${domain}/admin/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/admin/checkout/cancel`,
      payment_method_types: ["card"],
      metadata: {
        discount_percent: discountPercent ? discountPercent.toFixed(2) : "0",
        tax_rate: taxRate ? taxRate.toFixed(2) : "0",
        tax_amount: taxAmount ? taxAmount.toFixed(2) : "0",
      },
    });

    await logCheckoutAudit('checkout', { items: body.items, sessionId: session.id, url: session.url });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe error", err);
    await logCheckoutAudit('checkout_failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
