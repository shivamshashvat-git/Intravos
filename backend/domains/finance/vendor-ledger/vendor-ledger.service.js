import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';

/**
 * VendorLedgerService — Supplier Payable & Receivable Orchestration
 */
class VendorLedgerService {
  /**
   * List of ledger entries
   */
  async listEntries(tenantId, filters) {
    const { supplier_id, is_paid, direction, due_from, due_to } = filters;
    let query = supabaseAdmin
      .from('vendor_ledger')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true });

    if (supplier_id) query = query.eq('supplier_id', supplier_id);
    if (direction) query = query.eq('direction', direction);
    if (is_paid !== undefined) query = query.eq('is_paid', String(is_paid) === 'true');
    if (due_from) query = query.gte('due_date', due_from);
    if (due_to) query = query.lte('due_date', due_to);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Cash Flow Alerts (Upcoming Payables)
   */
  async getDashboardSummary(tenantId, alertThresholdHours = 72) {
    const now = new Date();
    const threshold = new Date(now.getTime() + alertThresholdHours * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('vendor_ledger')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_paid', false)
      .is('deleted_at', null)
      .lte('due_date', threshold)
      .order('due_date', { ascending: true });

    if (error) throw error;

    const summaryBySupplier = {};
    for (const entry of data || []) {
      const key = entry.supplier_id;
      if (!summaryBySupplier[key]) {
        summaryBySupplier[key] = { supplier_id: key, payable: 0, receivable: 0, entries: 0 };
      }
      const amt = toAmount(entry.amount);
      if (entry.direction === 'agency_to_vendor') summaryBySupplier[key].payable += amt;
      else summaryBySupplier[key].receivable += amt;
      summaryBySupplier[key].entries += 1;
    }

    return {
      high_alert: data || [],
      due_within_hours: alertThresholdHours,
      supplier_summary: Object.values(summaryBySupplier)
    };
  }

  /**
   * Record manual ledger entry
   */
  async addEntry(tenantId, userId, payload) {
    if (!payload.supplier_id) throw new Error('supplier_id is required');

    const entry = {
      tenant_id: tenantId,
      supplier_id: payload.supplier_id,
      booking_id: payload.booking_id || null,
      booking_service_id: payload.booking_service_id || null,
      direction: payload.direction || 'agency_to_vendor',
      amount: toAmount(payload.amount),
      due_date: payload.due_date || null,
      paid_date: payload.paid_date || null,
      is_paid: payload.is_paid === true,
      payment_reference: payload.payment_reference || null,
      notes: payload.notes || null,
      created_by: userId
    };

    const { data, error } = await supabaseAdmin
      .from('vendor_ledger')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Close a ledger item
   */
  async markPaid(tenantId, entryId, payload) {
    const { data, error } = await supabaseAdmin
      .from('vendor_ledger')
      .update({
        is_paid: true,
        paid_date: payload.paid_date || new Date().toISOString().split('T')[0],
        payment_reference: payload.payment_reference || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Net Position with a Supplier
   */
  async getSupplierBalance(tenantId, supplierId) {
    const { data, error } = await supabaseAdmin
      .from('vendor_ledger')
      .select('amount, direction, is_paid')
      .eq('tenant_id', tenantId)
      .eq('supplier_id', supplierId)
      .is('deleted_at', null);

    if (error) throw error;

    let totalPayable = 0;
    let totalReceivable = 0;
    let totalPaidToVendor = 0;

    for (const entry of data || []) {
      const amt = toAmount(entry.amount);
      if (entry.direction === 'agency_to_vendor') {
        totalPayable += amt;
        if (entry.is_paid) totalPaidToVendor += amt;
      } else {
        totalReceivable += amt;
      }
    }

    return {
      total_payable: totalPayable,
      total_paid: totalPaidToVendor,
      total_receivable: totalReceivable,
      current_balance: totalPayable - totalPaidToVendor - totalReceivable
    };
  }
}

export default new VendorLedgerService();
