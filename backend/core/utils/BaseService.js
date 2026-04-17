import { supabaseAdmin } from '../../providers/database/supabase.js';

/**
 * BaseService
 * 
 * The Foundation for all business logic in Intravos.
 * Enforces multi-tenancy at the service layer, provides standardized audit logging,
 * and encapsulates complex database operations.
 */
export default class BaseService {
  constructor(req) {
    this.supabase = req.supabase || supabaseAdmin;
    this.user = req.user;
    this.tenantId = req.user?.tenantId;
  }

  /**
   * Standardized Audit Logger
   */
  async logActivity(entityType, entityId, action, details = {}, changes = {}) {
    try {
      await this.supabase.from('activity_logs').insert({
        tenant_id: this.tenantId,
        entity_type: entityType,
        entity_id: entityId,
        user_id: this.user?.id,
        action,
        details,
        changes
      });
    } catch (err) {
      console.error(`[BaseService] Audit log failed for ${entityType}/${entityId}:`, err);
    }
  }

  /**
   * Standard find with multi-tenancy enforcement
   */
  async find(table, options = {}) {
    const { select = '*', filters = {}, orderBy = { column: 'created_at', ascending: false }, range } = options;
    
    let query = this.supabase
      .from(table)
      .select(select)
      .eq('tenant_id', this.tenantId)
      .is('deleted_at', null);

    // Apply custom filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query = query.eq(key, val);
      }
    });

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    if (range) {
      query = query.range(range.from, range.to);
    }

    return await query;
  }

  async findOne(table, id, select = '*') {
    return await this.supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .is('deleted_at', null)
      .single();
  }
}
