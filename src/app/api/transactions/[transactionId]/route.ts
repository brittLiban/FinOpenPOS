import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
    
  } = await supabase.auth.getUser();
  

  if (authError || !user) {
    
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("Current user UID:", user.id);
  const transactionId = params.transactionId;
  const body = await request.json();
  console.log("Incoming update body:", body); // 👈 Add this

  // Validate required fields
  const requiredFields = ["description", "category", "amount", "type", "status"];
  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      description: body.description,
      category: body.category,
      amount: body.amount,
      type: body.type,
      status: body.status,
      user_uid: user.id,
    })
    .eq("id", transactionId)
    .eq("user_uid", user.id)
    .select(); // ✅ No .single()

  if (error) {
    console.error("PUT /transactions/:id failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Update result:", data); // add right before the guard

  if (!data || data.length === 0) {
    return NextResponse.json({ message: "No changes made" }, { status: 200 });
  }

  console.log("Update affected rows:", data.length); // might be 0

  return NextResponse.json(data[0]);
} // ✅ <-- THIS closing brace was missing

// DELETE handler
export async function DELETE(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactionId = params.transactionId;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_uid", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Transaction deleted successfully" });
}
