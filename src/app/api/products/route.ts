import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/log-audit'
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';

export async function GET(request: Request) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();
    const { searchParams } = new URL(request.url);
    
    // Server-side filtering parameters
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply server-side filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (inStock === 'in-stock') {
      query = query.gt('in_stock', 0);
    } else if (inStock === 'out-of-stock') {
      query = query.eq('in_stock', 0);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();

    const newProduct = await request.json();

    // Add company_id and user_uid to the product
    const productWithCompany = {
      ...newProduct,
      company_id: companyId,
      user_uid: user.id
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productWithCompany])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 🔁 Trigger product sync to Stripe
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-products?product_id=${data[0].id}`);
    } catch (syncError) {
      console.error("⚠️ Sync to Stripe failed:", syncError);
      // Optional: log this somewhere or notify admin
    }

    // Audit log
    await logAudit({
      userId: user.id,
      actionType: 'create',
      entityType: 'product',
      entityId: data[0]?.id ? String(data[0].id) : undefined,
      companyId: companyId,
      details: { newProduct: data[0] }
    });
    
    return NextResponse.json(data[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}
