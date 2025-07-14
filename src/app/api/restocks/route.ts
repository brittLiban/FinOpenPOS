import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();

  /* ── auth ─────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* ── body ─────────────────────────────── */
  const { product_id, quantity } = await req.json();
  if (!product_id || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    /* 1️⃣  call the RPC that atomically bumps stock and returns the row */
    const { data: rows, error: rpcErr } = await supabase
      .rpc("increment_in_stock", { p_product_id: product_id, p_qty: quantity });

    if (rpcErr) throw rpcErr;
    const prod = rows?.[0];

    /* 2️⃣  optional ledger entry */
    await supabase.from("transactions").insert({
      product_id,
      amount: 0,                 // stock‑only action
      user_uid: user.id,
      type: "expense",
      category: "restock",
      description: `Restocked ${quantity} × ${prod.name}`,
    });

    return NextResponse.json(prod, { status: 201 });
  } catch (err: any) {
    console.error("POST /restocks error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
