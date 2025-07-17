import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get('authorization');
  let accessToken = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.replace('Bearer ', '');
  }
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // Query user_roles and roles
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // data is an array, get the first role if exists
  let roleName = null;
  if (data && data.length > 0 && Array.isArray(data[0].roles) && data[0].roles.length > 0) {
    roleName = data[0].roles[0].name;
  }
  return NextResponse.json({ role: roleName });
}
