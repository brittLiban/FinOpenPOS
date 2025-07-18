import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const { user_id, password } = await req.json();
    if (!user_id || !password) {
      return NextResponse.json({ error: 'User ID and password are required.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user_id, { password });
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to change password.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to change password.' }, { status: 500 });
  }
}
