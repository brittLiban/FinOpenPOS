import { createClient } from './supabase/client';

/**
 * Log an action to the audit log table.
 * @param userId - UUID of the user performing the action
 * @param actionType - e.g. 'create', 'update', 'delete', 'transaction', etc.
 * @param entityType - e.g. 'employee', 'product', 'order', etc.
 * @param entityId - ID of the affected entity (string for flexibility)
 * @param details - Arbitrary details about the change (object will be stored as JSON)
 */
export async function logAudit({
  userId,
  actionType,
  entityType,
  entityId,
  details = {}
}: {
  userId: string | null,
  actionType: string,
  entityType: string,
  entityId?: string,
  details?: any
}) {
  const supabase = createClient();
  await supabase.from('audit_log').insert([
    {
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      details
    }
  ]);
}
