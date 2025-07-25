import { createAdminClient } from './supabase/service';

/**
 * Log an action to the audit log table.
 * @param userId - UUID of the user performing the action
 * @param actionType - e.g. 'create', 'update', 'delete', 'transaction', etc.
 * @param entityType - e.g. 'employee', 'product', 'order', etc.
 * @param entityId - ID of the affected entity (string for flexibility)
 * @param details - Arbitrary details about the change (object will be stored as JSON)
 * @param companyId - UUID of the company (REQUIRED for multi-tenancy)
 */
export async function logAudit({
  userId,
  actionType,
  entityType,
  entityId,
  details = {},
  companyId
}: {
  userId: string | null,
  actionType: string,
  entityType: string,
  entityId?: string,
  details?: any,
  companyId?: string // Made optional with auto-fetch fallback
}) {
  const supabase = createAdminClient();
  
  let finalCompanyId = companyId;
  
  // Auto-fetch company_id if not provided and userId is available
  if (!finalCompanyId && userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profile?.company_id) {
        finalCompanyId = profile.company_id;
        console.log(`🔍 Auto-fetched company_id for audit log: ${finalCompanyId}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to auto-fetch company_id for audit log:', error);
    }
  }
  
  // SECURITY: company_id is required to prevent audit log data mixing
  if (!finalCompanyId) {
    throw new Error('company_id is required for audit logging to maintain multi-tenant isolation');
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(finalCompanyId)) {
    throw new Error(`Invalid company_id format: ${finalCompanyId}`);
  }
  
  try {
    const { error } = await supabase.from('audit_log').insert([
      {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
        company_id: finalCompanyId
      }
    ]);
    
    if (error) {
      console.error('❌ Audit log failed:', error);
      // Don't throw - audit failure shouldn't break the main operation
    }
  } catch (auditError) {
    console.error('❌ Audit log error:', auditError);
    // Don't throw - audit failure shouldn't break the main operation
  }
}
