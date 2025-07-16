// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Could not fetch products" }, { status: 500 });
    }

    // Step 2: Build line items using stripe_price_id
    const line_items = body.items.map((item: any) => {
      const matchedProduct = products.find((p) => p.id === item.id);
      if (!matchedProduct?.stripe_price_id) {
        throw new Error(`Missing stripe_price_id for product ${item.id}`);
      }

      return {
        price: matchedProduct.stripe_price_id,
        quantity: item.quantity,
      };
    });

    // Step 3: Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${domain}/admin/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/admin/checkout/cancel`,
      payment_method_types: ["card"],
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
