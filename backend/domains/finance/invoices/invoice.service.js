import { supabaseAdmin } from '../../../providers/database/supabase.js';
import financialService from '../shared/financialService.js';
import quotationService from '../quotations/quotation.service.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * InvoiceService — Financial Orchestration & GST Compliance
 */
class InvoiceService {
  /**
   * Create a manual invoice
   */
  async createInvoice(tenantId, userId, payload) {
    const { items, place_of_supply, ...invoiceData } = payload;
    
    // 1. Context & Calculations
    const { data: tenant } = await supabaseAdmin.from('tenants').select('*').eq('id', tenantId).single();
    if (!tenant.invoice_prefix) throw new Error('Invoice settings not configured');

    const fin = financialService.calculateGst(items, tenant.agency_state, place_of_supply);
    const fy = financialService.getCurrentFinancialYear();
    const invoiceNumber = `${tenant.invoice_prefix}/${fy}/${String(tenant.invoice_next_num).padStart(4, '0')}`;

    // 2. Database Insertion
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        ...invoiceData,
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        financial_year: fy,
        agency_name: tenant.name,
        agency_address: tenant.agency_address,
        agency_gstin: tenant.gstin,
        agency_pan: tenant.pan,
        place_of_supply,
        subtotal: fin.subtotal,
        gst_type: fin.gstType,
        cgst: fin.cgst,
        sgst: fin.sgst,
        igst: fin.igst,
        total: fin.total,
        amount_outstanding: fin.total,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    const lineItems = fin.processedItems.map(item => ({
      tenant_id: tenantId,
      invoice_id: invoice.id,
      description: item.description,
      sac_code: item.sac_code || '998551',
      amount: item.amount,
      gst_rate: item.gst_rate,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      total: item.total,
      sort_order: item.sort_order
    }));

    await supabaseAdmin.from('invoice_items').insert(lineItems);
    await supabaseAdmin.from('tenants').update({ invoice_next_num: tenant.invoice_next_num + 1 }).eq('id', tenantId);

    return invoice;
  }

  /**
   * Convert Proposal to Final Invoice
   */
  async convertQuotationToInvoice(tenantId, userId, quoteId) {
    const quotation = await quotationService.getById(tenantId, quoteId);
    if (!quotation) throw new Error('Quotation not found');

    const invoice = await this.createInvoice(tenantId, userId, {
      lead_id: quotation.lead_id,
      quotation_id: quotation.id,
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      customer_phone: quotation.customer_phone,
      customer_email: quotation.customer_email,
      customer_gstin: quotation.customer_gstin,
      place_of_supply: quotation.place_of_supply,
      items: quotation.quotation_items
    });

    // Update Lead to 'converted' state
    await supabaseAdmin.from('leads').update({ 
      status: 'converted', 
      selling_price: quotation.total, 
      cost_price: quotation.total_cost_price, 
      margin: quotation.total_margin 
    }).eq('id', quotation.lead_id);

    // Mark quotation as accepted if not already
    if (quotation.status !== 'accepted') {
       await supabaseAdmin.from('quotations').update({ status: 'accepted' }).eq('id', quoteId);
    }

    return invoice;
  }

  async getById(tenantId, invoiceId) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*), payments:payment_transactions(*)')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data;
  }

  async listInvoices(tenantId, filters) {
    const { status, invoice_type, search, page = 1, limit = 50 } = filters;
    
    let query = supabaseAdmin
      .from('invoices')
      .select('*, customer:customers(name, email)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (invoice_type) query = query.eq('invoice_type', invoice_type);
    if (search) query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return { invoices: data, total: count, page: parseInt(page, 10) };
  }

  async updateInvoice(tenantId, userId, invoiceId, payload) {
    const { items, ...metadata } = payload;
    const oldSnapshot = await this.getById(tenantId, invoiceId);
    if (!oldSnapshot) throw new Error('Invoice not found');

    let updates = { ...metadata, updated_at: new Date().toISOString() };

    if (items) {
      const { data: tenant } = await supabaseAdmin.from('tenants').select('agency_state').eq('id', tenantId).single();
      const placeOfSupply = metadata.place_of_supply || oldSnapshot.place_of_supply;
      const fin = financialService.calculateGst(items, tenant.agency_state, placeOfSupply);
      
      updates = {
        ...updates,
        subtotal: fin.subtotal,
        cgst: fin.cgst,
        sgst: fin.sgst,
        igst: fin.igst,
        total: fin.total,
        amount_outstanding: fin.total - (oldSnapshot.amount_paid || 0),
        gst_type: fin.gstType
      };

      // Atomic Replace Items
      await supabaseAdmin.from('invoice_items').delete().eq('invoice_id', invoiceId);
      const newItems = fin.processedItems.map(item => ({
        tenant_id: tenantId,
        invoice_id: invoiceId,
        description: item.description,
        sac_code: item.sac_code || '998551',
        amount: item.amount,
        gst_rate: item.gst_rate,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total: item.total,
        sort_order: item.sort_order
      }));
      await supabaseAdmin.from('invoice_items').insert(newItems);

      // Audit price mutations
      await this._auditMutation(tenantId, userId, 'invoice', invoiceId, oldSnapshot, updates);
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteInvoice(tenantId, invoiceId) {
    return await softDeleteDirect({ table: 'invoices', id: invoiceId, tenantId });
  }

  /**
   * Recalculate invoice totals and payment status
   */
  async recalculate(tenantId, invoiceId) {
    const invoice = await this.getById(tenantId, invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalAmount = parseFloat(invoice.total);
    const outstanding = Math.max(0, totalAmount - totalPaid);

    let status = invoice.status;
    if (totalPaid === 0) {
      status = 'unpaid';
    } else if (outstanding <= 1) { // 1 unit tolerance for rounding
      status = 'paid';
    } else {
      status = 'partially_paid';
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({
        amount_paid: totalPaid,
        amount_outstanding: outstanding,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGstSummary(tenantId, financialYear) {
    const fy = financialYear || financialService.getCurrentFinancialYear();
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('financial_year', fy)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled');

    if (error) throw error;
    
    const byMonth = {};
    for (const inv of data) {
      const d = new Date(inv.created_at);
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const sortKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

      if (!byMonth[sortKey]) {
        byMonth[sortKey] = {
          month: key,
          sortKey,
          taxable_value: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total_tax: 0,
          total_value: 0,
          invoice_count: 0
        };
      }

      const invSubtotal = parseFloat(inv.subtotal) || 0;
      const invCgst = parseFloat(inv.cgst) || 0;
      const invSgst = parseFloat(inv.sgst) || 0;
      const invIgst = parseFloat(inv.igst) || 0;
      const invTotal = parseFloat(inv.total) || 0;

      byMonth[sortKey].taxable_value += invSubtotal;
      byMonth[sortKey].cgst += invCgst;
      byMonth[sortKey].sgst += invSgst;
      byMonth[sortKey].igst += invIgst;
      byMonth[sortKey].total_tax += (invCgst + invSgst + invIgst);
      byMonth[sortKey].total_value += invTotal;
      byMonth[sortKey].invoice_count += 1;
    }

    return Object.values(byMonth).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  async getGstr1Data(tenantId, filters) {
    const { financial_year, month } = filters;
    let fy = financial_year || financialService.getCurrentFinancialYear();
    
    let query = supabaseAdmin
      .from('invoices')
      .select('invoice_number, created_at, customer_name, customer_gstin, total, subtotal, cgst, sgst, igst')
      .eq('tenant_id', tenantId)
      .eq('financial_year', fy)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true });
      
    if (month) {
      // filtering by month (1-12) will be done in-memory for simplicity right now
      // as supabase year/month filtering can be complex without custom RPC
    }

    const { data, error } = await query;
    if (error) throw error;
    
    if (month) {
       return data.filter(inv => new Date(inv.created_at).getMonth() + 1 === parseInt(month, 10));
    }
    return data;
  }

  // ── AUDIT LOGGING ──

  async _auditMutation(tenantId, userId, entityType, entityId, oldSnapshot, newSnapshot) {
    const priceFields = ['subtotal', 'total', 'amount_paid', 'amount_outstanding'];
    for (const field of priceFields) {
      if (newSnapshot[field] !== undefined && parseFloat(newSnapshot[field]) !== parseFloat(oldSnapshot[field])) {
        await supabaseAdmin.from('financial_audit_log').insert({
          tenant_id: tenantId,
          entity_type: entityType,
          entity_id: entityId,
          field_changed: field,
          old_value: oldSnapshot[field],
          new_value: newSnapshot[field],
          snapshot_before: oldSnapshot,
          snapshot_after: newSnapshot,
          changed_by: userId
        });
      }
    }
  }
}

export default new InvoiceService();
