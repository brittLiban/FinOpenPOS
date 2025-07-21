import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();

    // Test companies table exists and structure
    const { data: tables, error: tablesError } = await admin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'companies');

    if (tablesError) {
      return NextResponse.json(
        { error: 'Failed to check tables', details: tablesError.message }, 
        { status: 500 }
      );
    }

    const companyTableExists = tables && tables.length > 0;

    // Test if we can query companies table
    let companiesTestResult = null;
    if (companyTableExists) {
      // Check companies table structure
      const { data: columns, error: columnsError } = await admin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'companies');

      const { data: companies, error: companiesError } = await admin
        .from('companies')
        .select('*')
        .limit(1);

      companiesTestResult = {
        success: !companiesError,
        error: companiesError?.message,
        count: companies?.length || 0,
        columns: columns?.map(c => c.column_name) || [],
        columnsError: columnsError?.message
      };
    }

    // Test auth access
    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    
    const authTestResult = {
      success: !usersError,
      error: usersError?.message,
      userCount: users?.users?.length || 0
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        companyTableExists,
        companiesTest: companiesTestResult,
        authTest: authTestResult
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message }, 
      { status: 500 }
    );
  }
}
