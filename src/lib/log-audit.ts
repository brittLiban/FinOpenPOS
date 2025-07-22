import { createClient } from './supabase/client';

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
  companyId: string // Made required to prevent audit log mixing
}) {
  const supabase = createClient();
  
  // SECURITY: company_id is now required to prevent audit log data mixing
  if (!companyId) {
    throw new Error('company_id is required for audit logging to maintain multi-tenant isolation');
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    throw new Error(`Invalid company_id format: ${companyId}`);
  }
  
  await supabase.from('audit_log').insert([
    {
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      details,
      company_id: companyId
    }
  ]);
}
