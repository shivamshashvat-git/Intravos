import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { getTrashTableConfig, restoreTrashRecord, permanentlyDeleteTrashRecord } from '../../../core/utils/softDelete.js';

/**
 * TrashService — Data Recovery & Permanent Deletion Orchestrator
 */
class TrashService {
  constructor() {
    this.EXTRA_TRASH_TABLES = [
      { table_name: 'suppliers', module_name: 'Suppliers', label: 'name', meta: ['supplier_type'] },
      { table_name: 'documents', module_name: 'Documents', label: 'file_name', meta: ['category'] },
      { table_name: 'vouchers', module_name: 'Vouchers', label: 'booking_reference', meta: ['guest_names'] },
      { table_name: 'vendor_ledger', module_name: 'Vendor Ledger', label: 'amount', meta: ['direction'] },
      { table_name: 'cancellations', module_name: 'Cancellations', label: 'reason', meta: ['service_status'] },
      { table_name: 'group_booking_members', module_name: 'Group Booking Members', label: 'member_name', meta: ['booking_id'] },
      { table_name: 'resource_hub_links', module_name: 'Resource Hub Links', label: 'title', meta: ['category'] },
    ];
  }

  /**
   * List all archived items with unified pagination and filtering
   */
  async listTrash(tenantId, isAdmin, filters) {
    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 25, 1), 100);
    const table = filters.table || filters.type || null;

    let query = supabaseAdmin
      .from('v_trash_items')
      .select('*', { count: 'exact' })
      .order('deleted_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (!isAdmin) {
      query = query.eq('tenant_id', tenantId);
    }
    if (table) {
      query = query.eq('table_name', table);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const extraTrash = await this._fetchExtraTrashItems(tenantId, isAdmin, table);
    const combined = [...(data || []), ...extraTrash]
      .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    const grouped = {};
    for (const item of combined) {
      const key = item.module_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    return {
      trash: combined,
      grouped,
      total: (count || 0) + extraTrash.length,
      retention_days: 30,
      page,
      limit
    };
  }

  /**
   * Restore an archived record to active state
   */
  async restoreItem(tenantId, userId, table, itemId) {
    const targetTenantId = await this._resolveTrashTenantId(tenantId, true, table, itemId);
    if (!targetTenantId) throw new Error('Archived record not found');

    const result = await restoreTrashRecord({
      table,
      id: itemId,
      tenantId: targetTenantId
    });

    if (result.error) throw new Error(result.error);

    // Audit Log for Restoration
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: targetTenantId,
      entity_type: table,
      entity_id: itemId,
      user_id: userId,
      action: 'restored_from_trash',
      details: { table, restored_at: new Date().toISOString() }
    });

    return result;
  }

  /**
   * Permanently purge an archived record
   */
  async purgeItem(tenantId, userId, table, itemId) {
    const targetTenantId = await this._resolveTrashTenantId(tenantId, true, table, itemId);
    if (!targetTenantId) throw new Error('Archived record not found');

    // Get item info BEFORE deletion for permanent audit log
    const config = getTrashTableConfig(table);
    const itemData = config ? await config.getRecord(itemId, targetTenantId) : null;

    const result = await permanentlyDeleteTrashRecord({
      table,
      id: itemId,
      tenantId: targetTenantId
    });

    if (result.error) throw new Error(result.error);

    // High Importance: Permanent Audit Log persists after the entity is gone
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: targetTenantId,
      entity_type: table,
      entity_id: itemId,
      user_id: userId,
      action: 'permanent_delete',
      details: {
        table,
        item_label: itemData?.item_label || itemData?.customer_name || 'Unknown',
        deleted_at: new Date().toISOString()
      }
    });

    return result;
  }

  // --- INTERNAL UTILITIES ---

  async _resolveTrashTenantId(tenantId, isAdmin, table, itemId) {
    const { data, error } = await supabaseAdmin
      .from('v_trash_items')
      .select('tenant_id')
      .eq('table_name', table)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const config = getTrashTableConfig(table);
      if (!config) return null;
      const record = await config.getRecord(itemId, tenantId);
      if (!record) return null;
      if (isAdmin) return record.tenant_id || tenantId;
      return record.tenant_id === tenantId ? tenantId : null;
    }

    if (isAdmin) return data.tenant_id;
    return data.tenant_id === tenantId ? tenantId : null;
  }

  async _fetchExtraTrashItems(tenantId, isAdmin, tableFilter) {
    const tables = tableFilter
      ? this.EXTRA_TRASH_TABLES.filter((item) => item.table_name === tableFilter)
      : this.EXTRA_TRASH_TABLES;

    const rows = [];
    for (const table of tables) {
      let query = supabaseAdmin
        .from(table.table_name)
        .select(`id, tenant_id, deleted_at, deleted_by, ${table.label}, ${table.meta.join(',')}`)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) continue;

      for (const item of data || []) {
        rows.push({
          table_name: table.table_name,
          module_name: table.module_name,
          tenant_id: item.tenant_id,
          item_id: item.id,
          item_label: String(item[table.label] || item.id),
          item_meta: table.meta.reduce((meta, key) => {
            meta[key] = item[key] || null;
            return meta;
          }, {}),
          deleted_at: item.deleted_at,
          deleted_by: item.deleted_by,
          deleted_by_name: 'Unknown staff'
        });
      }
    }
    return rows;
  }
}

export default new TrashService();
