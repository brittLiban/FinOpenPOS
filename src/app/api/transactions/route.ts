// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withCache } from "@/lib/api-cache";

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

  const { searchParams } = req.nextUrl;
  
  // Server-side filtering and pagination
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_uid', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply server-side filters
  if (type) {
    query = query.eq('type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.ilike('category', `%${category}%`);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

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
