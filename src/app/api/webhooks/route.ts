// Disable body parsing (required for Stripe)
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Mark as Node.js runtime (not edge)
export const runtime = "nodejs";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service"; // Adjust if your path is different

// Stripe initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
    console.log("✅  Webhook verified. Type:", event.type);
  } catch (err: any) {
    console.error("❌  Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log("ℹ️  Ignoring event type", event.type);
    return new Response("Ignored", { status: 200 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    // Fetch line-items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
    });

    console.log("▶️  Stripe returned", lineItems.data.length, "line‑items");

    const supabase = createAdminClient();

    for (const li of lineItems.data) {
      const price = await stripe.prices.retrieve(li.price.id);
      const product = await stripe.products.retrieve(price.product as string);

      const productIdStr = product.metadata.product_id;
      const qty = li.quantity ?? 0;

      if (!productIdStr) {
        console.warn("⚠️  product_id missing from Stripe metadata");
        continue;
      }

      const productId = productIdStr;

      const { error } = await supabase.rpc("decrement_inventory", {
        product_id: productId,
        quantity: qty,
      });

      if (error) {
        console.error("❌  Supabase RPC error:", error);
        throw error;
      }

      console.log(`✅  Inventory decremented | product_id=${productId} | qty=${qty}`);
    }

    const { error: orderErr } = await supabase.from("orders").insert({
      stripe_session_id: session.id,
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email,
    });

    if (orderErr) {
      console.error("⚠️  Could not insert order record:", orderErr);
    }

    return new Response("Success", { status: 200 });
  } catch (err) {
    console.error("❌  Webhook processing failed:", err);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
