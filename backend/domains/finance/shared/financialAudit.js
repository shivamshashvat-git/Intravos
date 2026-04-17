import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

/**
 * Financial Audit Trail Service
 * Logs all financial changes (price, markup, discount, payment overrides)
 * for absolute transparency. Visible to agency admins on a dedicated Audit Log screen.
 */

/**
 * Log a financial change with before/after snapshots.
 *
 * @param {object} params
 * @param {string} params.tenantId - Tenant UUID
 * @param {string} params.userId - User who made the change
 * @param {string} params.entityType - 'quotation' | 'invoice' | 'payment'
 * @param {string} params.entityId - UUID of the entity
 * @param {string} params.action - 'price_changed' | 'markup_adjusted' | 'payment_override' | 'discount_applied'
 * @param {object} params.oldValue - Previous value snapshot
 * @param {object} params.newValue - New value snapshot
 * @param {string} [params.reason] - Optional reason for the change
 */
export async function logFinancialChange({ tenantId, userId, entityType, entityId, action, oldValue, newValue, reason }) {
  const { error } = await supabaseAdmin
    .from('financial_audit_log')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue,
      new_value: newValue,
      reason: reason || null,
    });

  if (error) {
    logger.error('[FinancialAudit] Failed to log change:', error.message);
  }
}

/**
 * Fetch audit trail for a specific entity.
 */
export async function getEntityAuditTrail(tenantId, entityType, entityId) {
  const { data, error } = await supabaseAdmin
    .from('financial_audit_log')
    .select('*, users!financial_audit_log_user_id_fkey(name, email)')
    .eq('tenant_id', tenantId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all audit logs for a tenant (admin dashboard).
 */
export async function getTenantAuditLog(tenantId, { limit = 100, offset = 0 } = {}) {
  const { data, error, count } = await supabaseAdmin
    .from('financial_audit_log')
    .select('*, users!financial_audit_log_user_id_fkey(name, email)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { logs: data || [], total: count };
}
