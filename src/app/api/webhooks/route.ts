export const runtime = "nodejs";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  console.log("🔔 Webhook fired");

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
    console.log("✅ Webhook verified. Type:", event.type);
  } catch (err: any) {
    console.error("❌ Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log("ℹ️ Ignoring event type:", event.type);
    return new Response("Ignored", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log("📦 Session ID:", session.id);
  console.log("📦 Event ID:", event.id);

  const supabase = createAdminClient();

  // Get company ID from session metadata
  const companyId = session.metadata?.company_id;
  if (!companyId) {
    console.error("❌ No company_id in session metadata");
    return new Response("Missing company_id", { status: 400 });
  }

  // Check if session was already processed
  const { data: existingSession } = await supabase
    .from("processed_sessions")
    .select("session_id")
    .eq("session_id", session.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingSession) {
    console.log(`⚠️ Session ${session.id} already processed. Skipping.`);
    return new Response("Already processed", { status: 200 });
  }

  // Get line items from Stripe
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });
  console.log("📦 Stripe line items:");
  console.dir(lineItems.data, { depth: null });

  console.log(`📄 Stripe returned ${lineItems.data.length} line items:`);

  lineItems.data.forEach((li, index) => {
    console.log(
      `  🔸 Item ${index + 1}: desc="${li.description}", qty=${li.quantity}, priceId=${li.price?.id}`
    );
  });

  for (const li of lineItems.data) {
    if (!li.price) {
      console.warn("⚠️ Line item missing price object. Skipping.");
      continue;
    }

    // Skip tax items (they don't have product metadata)
    if (li.description?.includes("Tax")) {
      console.log("ℹ️ Skipping tax line item");
      continue;
    }

    const price = await stripe.prices.retrieve(li.price.id);
    const product = await stripe.products.retrieve(price.product as string);
    const productIdStr = product.metadata.product_id;
    const qty = li.quantity ?? 0;

    // Extra logging for debugging
    console.log(
      `🔍 Stripe product: id=${product.id}, name=${product.name}, metadata.product_id=${productIdStr}, lineItemQty=${qty}`
    );

    if (!productIdStr) {
      console.warn(
        `⚠️ product_id missing from Stripe product metadata for Stripe product ${product.id}. Skipping.`
      );
      continue;
    }

    if (!qty || qty < 1) {
      console.warn(
        `⚠️ Invalid quantity (${qty}) for product_id=${productIdStr}. Skipping.`
      );
      continue;
    }

    // Double-check product exists in Supabase for this company
    const { data: supaProduct, error: supaErr } = await supabase
      .from("products")
      .select("id, in_stock")
      .eq("id", productIdStr)
      .eq("company_id", companyId) // Ensure product belongs to the right company
      .maybeSingle();

    if (supaErr || !supaProduct) {
      console.error(
        `❌ Supabase product not found for product_id=${productIdStr} and company_id=${companyId}. Skipping.`
      );
      continue;
    }

    // Decrement inventory
    const { error } = await supabase.rpc("decrement_inventory", {
      product_id: productIdStr,
      quantity: qty,
    });

    if (error) {
      console.error(
        `❌ Supabase decrement_inventory error for product_id=${productIdStr}:`,
        error
      );
      // Optionally: return new Response("Inventory error", { status: 500 });
      continue;
    }

    console.log(
      `✅ Inventory updated: product_id=${productIdStr}, qty=${qty}, new_stock=${supaProduct.in_stock - qty}`
    );
  }

  // Insert order record with company isolation
  const { error: orderErr } = await supabase.from("orders").insert({
    stripe_session_id: session.id,
    amount_total: session.amount_total,
    customer_email: session.customer_details?.email,
    customer_name: session.customer_details?.name,
    company_id: companyId, // Ensure order is associated with the right company
  });

  if (orderErr) {
    console.error("⚠️ Could not insert order record:", orderErr);
  } else {
    console.log(`📦 Order record saved for session: ${session.id}, company: ${companyId}`);
  }

  // Mark session as processed with company isolation
  await supabase.from("processed_sessions").insert({
    session_id: session.id,
    company_id: companyId,
  });

  console.log("🧾 Session marked as processed.");
  return new Response("Success", { status: 200 });
}
