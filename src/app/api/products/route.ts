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

    // Start with basic fields that definitely exist and build dynamically
    const productForDB: any = {
      name: newProduct.name,
      barcode: newProduct.barcode || null,
      price: Number(newProduct.price) || 0,
      in_stock: Number(newProduct.in_stock) || Number(newProduct.quantity) || 0,
    };

    // Add optional fields dynamically to avoid schema cache issues
    if (companyId) {
      productForDB.company_id = companyId;
    }

    if (user.id) {
      productForDB.user_uid = user.id;
    }

    if (newProduct.description) {
      productForDB.description = newProduct.description;
    }
    
    if (newProduct.category) {
      productForDB.category = newProduct.category;
    }

    if (newProduct.low_stock_threshold !== undefined) {
      productForDB.low_stock_threshold = Number(newProduct.low_stock_threshold);
    }

    // Add image field (should work now)
    if (newProduct.image) {
      productForDB.image = newProduct.image;
    }

    console.log('Attempting to insert product:', productForDB);

    const { data, error } = await supabase
      .from('products')
      .insert([productForDB])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 🔁 Trigger product sync to Stripe (auto-sync after product creation)
    try {
      // Use request headers to construct the correct URL
      const host = request.headers.get('host') || 'localhost:3001';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      const syncResponse = await fetch(`${baseUrl}/api/sync-products`, {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || '',
        },
      });
      
      if (syncResponse.ok) {
        console.log(`✅ Auto-synced new product ${data[0].name} to Stripe`);
      } else if (syncResponse.status === 400) {
        // Expected if Stripe Connect not set up yet
        console.log(`⚠️ Stripe sync skipped for ${data[0].name} - Stripe Connect not configured`);
      } else {
        console.warn(`⚠️ Stripe sync failed for ${data[0].name}:`, syncResponse.status);
      }
    } catch (syncError) {
      console.error("⚠️ Auto-sync to Stripe failed:", syncError);
      // Fail silently - don't block product creation
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
    console.error('❌ Product creation error:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Not authenticated') || error.message?.includes('company_id')) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }
    
    // Otherwise it's a server error
    return NextResponse.json({ 
      error: 'Failed to create product', 
      details: error.message 
    }, { status: 500 });
  }
}
