import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/service";

// GET /api/settings?key=tax_rate
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ value: data.value });
}

// POST /api/settings { key, value }
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const { error } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
