import { NextResponse } from "next/server";
import { createClient }  from "@/lib/supabase/server";

type Params = { params: { orderId: string } };

/* ────────────────────────────────────────── */
/* GET  /api/orders/[orderId]                 */
/* ────────────────────────────────────────── */
export async function GET(_req: Request, { params }: Params) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        payment_method_id,
        total_amount,
        status,
        created_at,
        customer:customer_id ( name ),
        payment_method:payment_method_id ( name ),
        order_items (
          product_id,
          quantity,
          price,
          product:product_id ( name, price )
        )
      `
    )
    .eq("id", params.orderId)
    .eq("user_uid", user.id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/* ────────────────────────────────────────── */
/* PUT /api/orders/[orderId] – update order   */
/* ────────────────────────────────────────── */
export async function PUT(req: Request, { params }: Params) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.orderId);
  const {
    customer_id,
    payment_method_id,
    total_amount,
    status,
    products = [],
  } = await req.json();

  try {
    /* 1. update main order row */
    const { error: updErr } = await supabase
      .from("orders")
      .update({ customer_id, payment_method_id, total_amount, status })
      .eq("id", id)
      .eq("user_uid", user.id);

    if (updErr) throw updErr;

    /* 2. replace order_items (simple strategy) */
    await supabase.from("order_items").delete().eq("order_id", id);

    if (products.length) {
      const rows = products.map((p: any) => ({
        order_id: id,
        product_id: p.id,
        quantity: p.quantity,
        price: p.price,
        user_uid: user.id,
      }));
      const { error: itemErr } = await supabase.from("order_items").insert(rows);
      if (itemErr) throw itemErr;
    }

    /* 3. update transaction row */
    await supabase
      .from("transactions")
      .update({ payment_method_id, amount: total_amount })
      .eq("order_id", id)
      .eq("user_uid", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT /orders/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ────────────────────────────────────────── */
/* DELETE /api/orders/[orderId]               */
/* ────────────────────────────────────────── */
export async function DELETE(_req: Request, { params }: Params) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.orderId);

  try {
    /* delete items first (FK constraint) */
    await supabase.from("order_items").delete().eq("order_id", id);
    await supabase.from("transactions").delete().eq("order_id", id);

    /* delete main order */
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .eq("user_uid", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /orders/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
