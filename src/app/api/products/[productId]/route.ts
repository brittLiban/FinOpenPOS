// app/api/products/[productId]/route.ts
export const runtime = "nodejs";           // ensure pooled Postgres, not edge

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ---------- helpers ---------- */
const supa = () => createClient();

async function getUser() {
  const { data } = await supa().auth.getUser();
  return data.user;
}

/* ---------- PUT /api/products/[productId] ---------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const { data, error } = await supa()
    .from("products")
    .update({ ...body, user_uid: user.id })
    .eq("id", params.productId)
    .eq("user_uid", user.id)
    .select()
    .single();

  if (error) {
    console.error("PRODUCT UPDATE ERROR:", error);           // dev hint
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* ---------- DELETE /api/products/[productId] ---------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supa()
    .from("products")
    .delete()
    .eq("id", params.productId)
    .eq("user_uid", user.id);

  if (error) {
    console.error("PRODUCT DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Product deleted" });
}

/* ---------- GET /api/products ---------- */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "100";
  const offset = searchParams.get("offset") || "0";

  const { data: products, error } = await supa()
    .from("products")
    .select()
    .eq("user_uid", user.id)
    .order("created_at", { ascending: false })
    .range(+offset, +offset + +limit - 1);

  if (error) {
    console.error("PRODUCTS FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products);
}
