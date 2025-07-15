// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST() {
  const domain =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // ✅ scheme!

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Test product" },
            unit_amount: 5000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${domain}/admin/checkout/success?session_id={CHECKOUT_SESSION_ID}`, // ✅ absolute
      cancel_url: `${domain}/admin/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? "Stripe error" },
      { status: 500 }
    );
  }
}
