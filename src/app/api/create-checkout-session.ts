// pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { productId, quantity = 1, customerEmail } = req.body;
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("stripe_price_id")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product?.stripe_price_id) {
    return res.status(400).json({ error: "Product or Stripe price not found" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price: product.stripe_price_id,
      quantity,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    customer_email: customerEmail,
  });

  res.status(200).json({ sessionId: session.id });
}
