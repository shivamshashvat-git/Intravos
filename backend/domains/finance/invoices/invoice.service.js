import { supabaseAdmin } from '../../../providers/database/supabase.js';
import financialService from '../shared/financialService.js';
import seedService from '../../system/system/seedService.js';

/**
 * InvoiceService — Financial Orchestration & GST Compliance
 */
class InvoiceService {
  /**
   * Create a manual invoice
   */
  async createInvoice(tenantId, userId, payload) {
    const { items, gst_type, ...invoiceData } = payload;
    
    // 1. Context & Calculations
    const { data: tenant } = await supabaseAdmin.from('tenants').select('*').eq('id', tenantId).single();
    if (!tenant.invoice_prefix) throw new Error('Invoice settings not configured');

    const fin = financialService.calculateGst(items, gst_type);
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
        subtotal: fin.subtotal,
        gst_type,
        cgst: fin.cgst,
        sgst: fin.sgst,
        igst: fin.igst,
        total: fin.total,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    const lineItems = fin.processedItems.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      sac_code: item.sac_code || '998551',
      amount: item.amount,
      gst_rate: item.gst_rate,
      cgst: gst_type === 'cgst_sgst' ? (item.gst_amount / 2) : 0,
      sgst: gst_type === 'cgst_sgst' ? (item.gst_amount / 2) : 0,
      igst: gst_type === 'igst' ? item.gst_amount : 0,
      total: item.amount + item.gst_amount,
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
      items: quotation.quotation_items,
      gst_type: quotation.gst_type
    });

    // Update Lead to 'booked' state
    await supabaseAdmin.from('leads').update({ 
      status: 'booked', 
      final_price: quotation.total, 
      vendor_cost: quotation.total_vendor_cost, 
      margin: quotation.total_margin 
    }).eq('id', quotation.lead_id);

    return invoice;
  }

  async getById(tenantId, invoiceId) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Aggregate GST Summary
   */
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
    
    // Aggregation logic moved from controller...
    const byMonth = {};
    for (const inv of data) {
      const d = new Date(inv.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, taxable_value: 0, total_tax: 0, invoice_count: 0 };
      byMonth[key].taxable_value += parseFloat(inv.subtotal) || 0;
      byMonth[key].total_tax += (parseFloat(inv.cgst) + parseFloat(inv.sgst) + parseFloat(inv.igst)) || 0;
      byMonth[key].invoice_count += 1;
    }

    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * List invoices with multi-tenant filtering and pagination
   */
  async listInvoices(tenantId, filters) {
    const { status, invoice_type, lead_id, customer_id, from, to, financial_year, page = 1, limit = 50 } = filters;
    
    let query = supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (invoice_type) query = query.eq('invoice_type', invoice_type);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (financial_year) query = query.eq('financial_year', financial_year);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { invoices: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Assemble data for secure public invoice sharing
   */
  async getPublicInvoiceShare(invoiceIdOrToken) {
    // Note: In simple mode, invoiceId is used as token
    const invoice = await this.getById(null, invoiceIdOrToken);
    if (!invoice) return null;

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('name, logo_url, primary_color, secondary_color, agency_address, agency_phone, agency_email, agency_website, gstin, pan, invoice_bank_text')
      .eq('id', invoice.tenant_id)
      .single();

    return { invoice, tenant_branding: tenant };
  }

  /**
   * Fetch and shape data for GSTR-1 accountant export
   */
  async getGstr1Data(tenantId, filters) {
    const { from, to, financial_year } = filters;
    
    let query = supabaseAdmin
      .from('invoices')
      .select('invoice_number, created_at, customer_name, customer_gstin, place_of_supply, subtotal, cgst, sgst, igst, total, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true });

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (financial_year) query = query.eq('financial_year', financial_year);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export default new InvoiceService();
