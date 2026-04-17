import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * SupplierService — Industrialized Vendor & Supply Chain Governance
 */
class SupplierService {
  /**
   * List specialized vendors
   */
  async list(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get exhaustive vendor profile
   */
  async getById(tenantId, supplierId) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Onboard new supplier
   */
  async create(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update supplier profile with standardized normalization
   */
  async update(tenantId, supplierId, payload) {
    const updates = { ...payload, updated_at: new Date().toISOString() };
    delete updates.id;
    delete updates.tenant_id;
    delete updates.deleted_at;
    delete updates.deleted_by;

    // Normalize legacy 'type' field to 'supplier_type'
    if (updates.type && !updates.supplier_type) {
      updates.supplier_type = updates.type;
      delete updates.type;
    }

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch hydrated supplier profile with ledger insights
   */
  async getSupplierProfile(tenantId, supplierId) {
    const { data: supplier, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !supplier) return null;

    // Aggregate ledger & vouchers for profile insights
    const [{ data: ledger }, { data: vouchers }] = await Promise.all([
      supabaseAdmin
        .from('vendor_ledger')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('vouchers')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    ]);

    const ledgerSummary = (ledger || []).reduce((acc, entry) => {
      const amount = Number(entry.amount) || 0;
      if (entry.direction === 'agency_to_vendor') acc.payable += amount;
      else acc.receivable += amount;
      acc[entry.is_paid ? 'paid' : 'outstanding'] += amount;
      return acc;
    }, { payable: 0, receivable: 0, paid: 0, outstanding: 0 });

    return { 
      supplier, 
      ledger_summary: ledgerSummary, 
      ledger: ledger || [], 
      vouchers: vouchers || [] 
    };
  }

  /**
   * De-list supplier
   */
  async delete(tenantId, userId, supplierId) {
    return await softDeleteDirect({
      table: 'suppliers',
      id: supplierId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Supplier',
      select: 'id, name, deleted_at'
    });
  }
}

export default new SupplierService();
