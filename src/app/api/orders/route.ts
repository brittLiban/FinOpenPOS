import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ────────────────────────────────────────── */
/* GET  /api/orders  – return *all* orders    */
/* ────────────────────────────────────────── */
export async function GET() {
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
        payment_method:payment_method_id ( name )
      `
    )
    .eq("user_uid", user.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/* ────────────────────────────────────────── */
/* POST /api/orders – create a new order      */
/* ────────────────────────────────────────── */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* ── parse body ───────────────────────── */
  const {
    customer_id,
    payment_method_id,
    total_amount,
    status = "pending",
    products = [], // [{id, quantity, price}]
  } = await req.json();

  try {
    /* 1️. insert order -------------------------------- */
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id,
        payment_method_id,
        total_amount,
        status,
        user_uid: user.id,
      })
      .select(
        "*, customer:customer_id(name), payment_method:payment_method_id(name)"
      )
      .single();

    if (orderErr) throw orderErr;

    /* 2️. insert order_items -------------------------- */
    if (products.length) {
      const rows = products.map((p: any) => ({
        order_id: order.id,
        product_id: p.id,
        quantity: p.quantity,
        price: p.price,
        user_uid: user.id,
      }));

      const { error: itemErr } = await supabase
        .from("order_items")
        .insert(rows);

      if (itemErr) throw itemErr;
    }

    /* 2.5️ reduce stock for each product -------------------------- */
    for (const item of products) {
      const { id, quantity } = item;

      const { data: productData, error: stockFetchErr } = await supabase
        .from("products")
        .select("in_stock")
        .eq("id", id)
        .single();

      if (stockFetchErr || !productData) {
        return NextResponse.json(
          { error: `Failed to fetch stock for product ID ${id}` },
          { status: 400 }
        );
      }

      const newStock = productData.in_stock - quantity;

      if (newStock < 0) {
        return NextResponse.json(
          { error: `Not enough stock for product ID ${id}` },
          { status: 400 }
        );
      }

      const { error: stockUpdateErr } = await supabase
        .from("products")
        .update({ in_stock: newStock })
        .eq("id", id);

      if (stockUpdateErr) {
        return NextResponse.json(
          { error: `Failed to update stock for product ID ${id}` },
          { status: 500 }
        );
      }
    }

    /* 3️. insert transaction -------------------------- */
    await supabase.from("transactions").insert({
      order_id: order.id,
      payment_method_id,
      amount: total_amount,
      user_uid: user.id,
      status: "completed",
      category: "selling",
      type: "income",
      description: `Payment for order #${order.id}`,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error("POST /orders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
