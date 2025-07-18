import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to get date string for N days ago
type Range = '1d' | '7d' | '30d' | '3mo' | '6mo' | '1y';
function getStartDate(range: Range): string {
  const now = new Date();
  switch (range) {
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '3mo':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') as Range) || '30d';
  const startDate = getStartDate(range);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('type', 'income')
    .eq('user_uid', user.id)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by day
  const grouped: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = row.created_at.split('T')[0];
    grouped[day] = (grouped[day] || 0) + row.amount;
  }
  // Convert to array for charting
  const history = Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  return NextResponse.json({ history });
}
