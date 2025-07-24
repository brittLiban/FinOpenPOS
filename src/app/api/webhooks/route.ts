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

  // Handle different event types
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
      
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return new Response("Success", { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("📦 Processing checkout session:", session.id);
  console.log("📦 Session metadata:", session.metadata);

  const supabase = createAdminClient();

  // Get company ID and user ID from session metadata
  const companyId = session.metadata?.company_id;
  const userUid = session.metadata?.user_uid;
  
  if (!companyId) {
    console.error("❌ No company_id in session metadata");
    return;
  }

  if (!userUid) {
    console.warn("⚠️ No user_uid in session metadata, order will be created without user association");
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
    return;
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

  // Insert order record with company isolation and complete details
  console.log(`📦 Creating order for session ${session.id}, company ${companyId}, user ${userUid}`);
  
  const orderData = {
    stripe_session_id: session.id,
    amount_total: session.amount_total,
    total_amount: session.amount_total ? session.amount_total / 100 : 0, // Convert to dollars
    customer_email: session.customer_details?.email,
    customer_name: session.customer_details?.name || "Guest",
    payment_method_name: session.payment_method_types?.[0] || "card",
    status: session.payment_status === 'paid' ? 'completed' : 'pending',
    user_uid: userUid || null, // Associate with the user who initiated checkout
    company_id: companyId, // Ensure order is associated with the right company
  };
  
  console.log('📦 Order data:', orderData);
  
  const { data: orderData_result, error: orderErr } = await supabase
    .from("orders")
    .insert(orderData)
    .select('*')
    .single();

  if (orderErr) {
    console.error("⚠️ Could not insert order record:", orderErr);
  } else {
    console.log(`📦 Order record saved:`, orderData_result);
    console.log(`📦 Order ID: ${orderData_result.id}, Session: ${session.id}, Company: ${companyId}`);
  }

  // Update transaction status to completed
  const { error: transactionErr } = await supabase
    .from("transactions")
    .update({ status: 'completed' })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending');

  if (transactionErr) {
    console.error("⚠️ Could not update transaction status:", transactionErr);
  } else {
    console.log(`💰 Transaction marked as completed for session: ${session.id}`);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log("🏦 Processing account update:", account.id);
  
  const supabase = createAdminClient();
  
  // Update company Stripe status
  const { error } = await supabase
    .from('companies')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_onboarding_complete: account.details_submitted && account.charges_enabled
    })
    .eq('stripe_account_id', account.id);

  if (error) {
    console.error("⚠️ Could not update company Stripe status:", error);
  } else {
    console.log(`🏦 Updated Stripe status for account: ${account.id}`);
    console.log(`✅ Charges enabled: ${account.charges_enabled}`);
    console.log(`💸 Payouts enabled: ${account.payouts_enabled}`);
    console.log(`📋 Details submitted: ${account.details_submitted}`);
  }
}
