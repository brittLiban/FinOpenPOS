import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET () {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const { data, error } = await supabase
    .from('v_products_low_stock')
    .select('id,name,in_stock,low_stock_threshold')
    .eq('is_low', true)
    .eq('user_uid', user.id)

  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  return NextResponse.json({ lowStock:data })
}
