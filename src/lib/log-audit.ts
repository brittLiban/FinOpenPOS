import { createClient } from './supabase/client';

/**
 * Log an action to the audit log table.
 * @param userId - UUID of the user performing the action
 * @param actionType - e.g. 'create', 'update', 'delete', 'transaction', etc.
 * @param entityType - e.g. 'employee', 'product', 'order', etc.
 * @param entityId - ID of the affected entity (string for flexibility)
 * @param details - Arbitrary details about the change (object will be stored as JSON)
 * @param companyId - UUID of the company (required for multi-tenancy)
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
  companyId?: string
}) {
  const supabase = createClient();
  
  // Fallback company_id if not provided (should be updated to use proper company_id)
  const finalCompanyId = companyId || '00000000-0000-0000-0000-000000000000';
  
  await supabase.from('audit_log').insert([
    {
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      details,
      company_id: finalCompanyId
    }
  ]);
}
