// src/app/api/checkout/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details", "line_items.data.price.product"],
    });

    return NextResponse.json(session);
  } catch (err: any) {
    console.error("❌ Failed to retrieve session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
