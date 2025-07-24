// Production webhook handler modifications
// This shows how to handle webhooks for multiple tenants

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(req: Request) {
  console.log("🔔 Production webhook fired");

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  
  // Use the production webhook secret
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
      // Handle Stripe Connect account updates
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
      
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return new Response("Success", { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  
  // Get company and user from session metadata
  const companyId = session.metadata?.company_id;
  const userUid = session.metadata?.user_uid;
  
  if (!companyId) {
    console.error("❌ No company_id in session metadata");
    return;
  }

  // Create order record
  const { error: orderErr } = await supabase.from("orders").insert({
    stripe_session_id: session.id,
    amount_total: session.amount_total,
    total_amount: session.amount_total ? session.amount_total / 100 : 0,
    customer_email: session.customer_details?.email,
    customer_name: session.customer_details?.name || "Guest",
    payment_method_name: session.payment_method_types?.[0] || "card",
    status: session.payment_status === 'paid' ? 'completed' : 'pending',
    user_uid: userUid || null,
    company_id: companyId,
  });

  if (orderErr) {
    console.error("⚠️ Could not insert order record:", orderErr);
  } else {
    console.log(`📦 Order created for company: ${companyId}`);
  }

  // Update inventory (existing logic)
  // ... inventory update code ...
}

async function handleAccountUpdated(account: Stripe.Account) {
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
    console.log(`📦 Updated Stripe status for account: ${account.id}`);
  }
}
