import { supabaseAdmin } from '../../../providers/database/supabase.js';
import financialService from '../shared/financialService.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import logger from '../../../core/utils/logger.js';

/**
 * QuotationService — Sales & Proposal Engine
 */
class QuotationService {
  /**
   * Create a new quotation
   */
  async createQuotation(tenantId, userId, payload) {
    const { lead_id, items, place_of_supply, inclusions, exclusions, terms, valid_until } = payload;

    // 1. Fetch Core Context
    const [{ data: lead, error: leadErr }, { data: tenant, error: tenantErr }] = await Promise.all([
      supabaseAdmin.from('leads').select('*, customers(gst_number)').eq('id', lead_id).eq('tenant_id', tenantId).single(),
      supabaseAdmin.from('tenants').select('agency_state, quote_prefix, quote_next_num, quote_validity, quote_terms, quote_inclusions, quote_exclusions').eq('id', tenantId).single()
    ]);

    if (leadErr) console.error('Lead Fetch Error:', leadErr);
    if (tenantErr) console.error('Tenant Fetch Error:', tenantErr);
    if (!lead) throw new Error(`Lead not found: ${lead_id}`);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

    // 2. Financial Calculations
    const fin = financialService.calculateGst(items, tenant.agency_state, place_of_supply || lead.destination);
    const quoteNumber = `${tenant.quote_prefix}/${new Date().getFullYear()}/${String(tenant.quote_next_num).padStart(4, '0')}`;
    const validUntilDate = valid_until || new Date(Date.now() + (tenant.quote_validity || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 3. Database Insertion
    const { data: quotation, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .insert({
        tenant_id: tenantId,
        lead_id: lead_id,
        customer_id: lead.customer_id,
        quote_number: quoteNumber,
        customer_name: lead.customer_name,
        customer_phone: lead.customer_phone,
        customer_email: lead.customer_email,
        customer_gstin: lead.customers?.gst_number,
        destination: lead.destination,
        place_of_supply: place_of_supply || lead.destination,
        subtotal: fin.subtotal, 
        gst_rate: fin.processedItems[0]?.gst_rate || 5, // Defaulting to first item's rate if mixed
        gst_type: fin.gstType, 
        cgst: fin.cgst, 
        sgst: fin.sgst, 
        igst: fin.igst, 
        total: fin.total,
        total_amount: fin.total,
        total_cost_price: fin.totalVendorCost,
        total_margin: fin.totalMargin,
        margin_percentage: fin.subtotal > 0 ? (fin.totalMargin / fin.subtotal) * 100 : 0,
        inclusions: inclusions || tenant.quote_inclusions,
        exclusions: exclusions || tenant.quote_exclusions,
        terms: terms || tenant.quote_terms,
        valid_until: validUntilDate,
        created_by: userId,
        version: 1
      })
      .select()
      .single();

    if (quoteErr) throw quoteErr;

    // Line Items
    const lineItems = fin.processedItems.map(item => ({
      tenant_id: tenantId,
      quotation_id: quotation.id,
      item_type: item.type || 'other',
      description: item.description,
      sac_code: item.sac_code,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.amount,
      amount: item.amount,
      gst_rate: item.gst_rate,
      gst_amount: item.gst_amount,
      cost_price: item.cost_price,
      sort_order: item.sort_order
    }));

    await supabaseAdmin.from('quotation_items').insert(lineItems);

    // 4. Lifecycle & Counters
    await Promise.all([
      supabaseAdmin.from('tenants').update({ quote_next_num: tenant.quote_next_num + 1 }).eq('id', tenantId),
      this._handleLeadStatus(tenantId, userId, lead_id, lead.status, quoteNumber, fin.total)
    ]);

    return quotation;
  }

  /**
   * Create a revised version: status tracking + version++
   */
  async reviseQuotation(tenantId, userId, quoteId) {
    const original = await this.getById(tenantId, quoteId);
    if (!original) throw new Error('Quotation not found');

    // Mark original as revised
    await supabaseAdmin.from('quotations').update({ status: 'revised' }).eq('id', quoteId);

    const { id, created_at, updated_at, quotation_items, ...quoteData } = original;
    
    // Create new version
    const { data: revision, error } = await supabaseAdmin
      .from('quotations')
      .insert({
        ...quoteData,
        version: (original.version || 1) + 1,
        parent_quote_id: quoteId,
        status: 'draft',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Copy line items
    if (quotation_items?.length > 0) {
      const newItems = quotation_items.map(({ id, quotation_id, created_at, ...item }) => ({
        ...item,
        quotation_id: revision.id
      }));
      await supabaseAdmin.from('quotation_items').insert(newItems);
    }

    return revision;
  }

  /**
   * Conversion: Quotation -> Invoice
   */
  async convertToInvoice(tenantId, userId, quoteId) {
    const quote = await this.getById(tenantId, quoteId);
    if (!quote) throw new Error('Quotation not found');
    if (quote.status !== 'accepted') {
       throw new Error('Only accepted quotations can be converted to invoices');
    }

    const { data: tenant } = await supabaseAdmin.from('tenants').select('invoice_prefix, invoice_next_num').eq('id', tenantId).single();
    const invoiceNumber = `${tenant.invoice_prefix}/${new Date().getFullYear()}/${String(tenant.invoice_next_num).padStart(4, '0')}`;

    // Create Invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        lead_id: quote.lead_id,
        quotation_id: quote.id,
        customer_id: quote.customer_id,
        invoice_number: invoiceNumber,
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone,
        customer_email: quote.customer_email,
        customer_gstin: quote.customer_gstin,
        place_of_supply: quote.place_of_supply,
        subtotal: quote.subtotal,
        gst_type: quote.gst_type,
        cgst: quote.cgst,
        sgst: quote.sgst,
        igst: quote.igst,
        total: quote.total,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by: userId
      })
      .select()
      .single();

    if (invErr) throw invErr;

    // Copy Items
    if (quote.quotation_items?.length > 0) {
      const invItems = quote.quotation_items.map(item => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        description: item.description,
        sac_code: item.sac_code,
        amount: item.amount,
        gst_rate: item.gst_rate,
        gst_amount: item.gst_amount,
        total: item.amount + (item.gst_amount || 0),
        sort_order: item.sort_order
      }));
      await supabaseAdmin.from('invoice_items').insert(invItems);
    }

    // Increment invoice counter
    await supabaseAdmin.from('tenants').update({ invoice_next_num: tenant.invoice_next_num + 1 }).eq('id', tenantId);

    return invoice;
  }

  async listQuotations(tenantId, filters) {
    const { status, customer_id, search, page = 1, limit = 50 } = filters;
    
    let query = supabaseAdmin
      .from('quotations')
      .select('*, customer:customers(name, email)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (search) query = query.or(`quote_number.ilike.%${search}%,title.ilike.%${search}%,customer_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return { quotations: data, total: count, page: parseInt(page, 10) };
  }

  async getById(tenantId, quoteId) {
    const { data, error } = await supabaseAdmin
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateQuotation(tenantId, userId, quoteId, payload) {
    const { items, ...metadata } = payload;
    const oldSnapshot = await this.getById(tenantId, quoteId);
    if (!oldSnapshot) throw new Error('Quotation not found');

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
        total_amount: fin.total,
        total_cost_price: fin.totalVendorCost,
        total_margin: fin.totalMargin,
        margin_percentage: fin.subtotal > 0 ? (fin.totalMargin / fin.subtotal) * 100 : 0,
        gst_type: fin.gstType
      };

      // Atomic Replace Items
      await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', quoteId);
      const newItems = fin.processedItems.map(item => ({
        tenant_id: tenantId,
        quotation_id: quoteId,
        item_type: item.type || 'other',
        description: item.description,
        sac_code: item.sac_code,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.amount,
        amount: item.amount,
        gst_rate: item.gst_rate,
        gst_amount: item.gst_amount,
        cost_price: item.cost_price,
        sort_order: item.sort_order
      }));
      await supabaseAdmin.from('quotation_items').insert(newItems);
      
      // Audit price mutations
      await this._auditMutation(tenantId, userId, 'quotation', quoteId, oldSnapshot, updates);
    }

    const { data, error } = await supabaseAdmin
      .from('quotations')
      .update(updates)
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteQuotation(tenantId, quoteId) {
    return await softDeleteDirect({ table: 'quotations', id: quoteId, tenantId });
  }

  // ── AUDIT LOGGING ──

  async _auditMutation(tenantId, userId, entityType, entityId, oldSnapshot, newSnapshot) {
    const priceFields = ['subtotal', 'total', 'total_amount', 'total_margin', 'total_cost_price'];
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
          changed_at: new Date().toISOString(),
          user_id: userId
        }).throwOnError();
      }
    }
  }

  // ── HELPERS ──

  async _handleLeadStatus(tenantId, userId, leadId, currentStatus, quoteNo, total) {
    if (['new', 'qualified', 'contacted'].includes(currentStatus)) {
      await supabaseAdmin.from('leads').update({ status: 'quote_sent' }).eq('id', leadId);
    }
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: tenantId, entity_type: 'lead', entity_id: leadId, user_id: userId,
      action: 'quotation_created',
      changes: { quote_number: quoteNo, total }
    });
  }
}

export default new QuotationService();
