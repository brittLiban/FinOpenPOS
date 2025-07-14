// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // Run on the node runtime

/* ─────────────────── GET  /api/transactions ─────────────────── */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_uid", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

/* ─────────────────── POST /api/transactions ─────────────────── */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  /* Basic validation */
  const required = ["description", "category", "amount", "type", "status"];
  for (const f of required) {
    if (
      body?.[f] === undefined ||
      body?.[f] === null ||
      body?.[f] === "" ||
      (f === "amount" && typeof body.amount !== "number")
    ) {
      return NextResponse.json(
        { error: `Invalid or missing '${f}'` },
        { status: 400 },
      );
    }
  }

  const { description, category, amount, type, status } = body;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      description,
      category,
      amount,
      type,
      status,
      user_uid: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
