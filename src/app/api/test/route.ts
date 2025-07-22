import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 });
    }
    
    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test the exact same query as the low-stock route
    const { data, error } = await supabase
      .from('products')
      .select('id, name, in_stock, low_stock_threshold')
      .eq('archived', false)
      .filter('in_stock', 'lte', 'low_stock_threshold');
    
    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: 'success',
      productCount: data?.length || 0,
      products: data?.slice(0, 3) || [],
      supabaseUrl: supabaseUrl.substring(0, 20) + '...'
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
