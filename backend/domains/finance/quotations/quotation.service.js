import { supabaseAdmin } from '../../../providers/database/supabase.js';
import financialService from '../shared/financialService.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * QuotationService — Sales & Proposal Engine
 */
class QuotationService {
  /**
   * Create a new quotation
   */
  async createQuotation(tenantId, userId, payload) {
    const { lead_id, items, gst_rate, gst_type, inclusions, exclusions, terms, valid_until } = payload;

    // 1. Fetch Core Context
    const [{ data: lead }, { data: tenant }] = await Promise.all([
      supabaseAdmin.from('leads').select('*, customers(gstin)').eq('id', lead_id).eq('tenant_id', tenantId).single(),
      supabaseAdmin.from('tenants').select('quote_prefix, quote_next_num, quote_validity, quote_terms, quote_inclusions, quote_exclusions').eq('id', tenantId).single()
    ]);

    if (!lead) throw new Error('Lead not found');

    // 2. Financial Calculations
    const fin = financialService.calculateGst(items, gst_type, gst_rate);
    const quoteNumber = `${tenant.quote_prefix}/${new Date().getFullYear()}/${String(tenant.quote_next_num).padStart(4, '0')}`;
    const validUntil = valid_until || new Date(Date.now() + (tenant.quote_validity || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 3. Database Insertion
    const { data: quotation, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .insert({
        tenant_id: tenantId,
        customer_id: lead.customer_id,
        quote_number: quoteNumber,
        customer_name: lead.customer_name,
        customer_phone: lead.customer_phone,
        customer_email: lead.customer_email,
        customer_gstin: lead.customers?.gstin,
        destination: lead.destination,
        start_date: lead.checkin_date,
        end_date: lead.checkout_date,
        guests: lead.guests,
        rooms: lead.rooms,
        subtotal: fin.subtotal, 
        gst_rate: gst_rate || 5, 
        gst_type, 
        cgst: fin.cgst, 
        sgst: fin.sgst, 
        igst: fin.igst, 
        total: fin.total,
        total_vendor_cost: fin.totalVendorCost,
        total_margin: fin.totalMargin,
        inclusions: inclusions || tenant.quote_inclusions,
        exclusions: exclusions || tenant.quote_exclusions,
        terms: terms || tenant.quote_terms,
        valid_until: validUntil,
        created_by: userId
      })
      .select()
      .single();

    if (quoteErr) throw quoteErr;

    // Line Items
    const lineItems = fin.processedItems.map(item => ({
      quotation_id: quotation.id,
      item_type: item.type || 'other',
      description: item.description,
      sac_code: item.sac_code,
      amount: item.amount,
      gst_rate: item.gst_rate,
      gst_amount: item.gst_amount,
      vendor_cost: item.vendor_cost,
      sort_order: item.sort_order
    }));

    await supabaseAdmin.from('quotation_items').insert(lineItems);

    // 4. Lifecycle & Counters
    await Promise.all([
      supabaseAdmin.from('tenants').update({ quote_next_num: tenant.quote_next_num + 1 }).eq('id', tenantId),
      this._handleLeadStatus(tenantId, userId, lead_id, lead.status, quoteNumber, fin.total),
      this._checkMilestone(userId)
    ]);

    return quotation;
  }

  /**
   * Create a revised version of a quotation
   */
  async reviseQuotation(tenantId, userId, quoteId) {
    const original = await this.getById(tenantId, quoteId);
    if (!original) throw new Error('Quotation not found');

    await supabaseAdmin.from('quotations').update({ status: 'revised' }).eq('id', quoteId);

    const { id, created_at, updated_at, quotation_items, ...quoteData } = original;
    const { data: revision, error } = await supabaseAdmin
      .from('quotations')
      .insert({
        ...quoteData,
        version: original.version + 1,
        parent_quote_id: original.id,
        status: 'draft',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

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
   * List quotations with pagination and relation hydration
   */
  async listQuotations(tenantId, filters) {
    const { status, lead_id, page = 1, limit = 50 } = filters;
    
    let query = supabaseAdmin
      .from('quotations')
      .select('*, leads(customer_name, destination)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (lead_id) query = query.eq('lead_id', lead_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return { quotations: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Recursive function to auto-forward to the latest active version
   * Fixes legacy Version Deadlock issues.
   */
  async resolveLatestVersion(quoteId) {
    const { data: quote } = await supabaseAdmin
      .from('quotations')
      .select('id, status, tenant_id')
      .eq('id', quoteId)
      .is('deleted_at', null)
      .single();
      
    if (!quote) return null;
    
    if (quote.status === 'revised') {
      const { data: child } = await supabaseAdmin
        .from('quotations')
        .select('id')
        .eq('parent_quote_id', quote.id)
        .is('deleted_at', null)
        .single();
        
      if (child) return await this.resolveLatestVersion(child.id);
    }
    return quote;
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

  /**
   * Create a separate copy of a quotation as a fresh draft
   */
  async duplicateQuotation(tenantId, userId, quoteId) {
    const original = await this.getById(tenantId, quoteId);
    if (!original) throw new Error('Quotation not found');

    const [{ data: tenant }] = await Promise.all([
      supabaseAdmin.from('tenants').select('quote_prefix, quote_next_num').eq('id', tenantId).single()
    ]);

    const quoteNumber = `${tenant.quote_prefix}/${new Date().getFullYear()}/${String(tenant.quote_next_num).padStart(4, '0')} (Copy)`;
    
    const { id, created_at, updated_at, quotation_items, quote_number, ...quoteData } = original;
    const { data: copy, error } = await supabaseAdmin
      .from('quotations')
      .insert({
        ...quoteData,
        quote_number: quoteNumber,
        status: 'draft',
        created_by: userId,
        version: 1
      })
      .select()
      .single();

    if (error) throw error;

    if (quotation_items?.length > 0) {
      const newItems = quotation_items.map(({ id, quotation_id, created_at, ...item }) => ({
        ...item,
        quotation_id: copy.id
      }));
      await supabaseAdmin.from('quotation_items').insert(newItems);
    }

    return copy;
  }

  /**
   * Update quotation metadata and recalculate financial totals
   */
  async updateQuotation(tenantId, quoteId, payload) {
    const { items, ...metadata } = payload;
    
    let updates = { ...metadata, updated_at: new Date().toISOString() };

    // If items are provided, we must recalculate the entire financial context
    if (items && items.length > 0) {
      const { data: current } = await supabaseAdmin.from('quotations').select('gst_type, gst_rate, lead_id').eq('id', quoteId).single();
      const fin = financialService.calculateGst(items, current.gst_type, current.gst_rate);
      
      updates = {
        ...updates,
        subtotal: fin.subtotal,
        cgst: fin.cgst,
        sgst: fin.sgst,
        igst: fin.igst,
        total: fin.total,
        total_vendor_cost: fin.totalVendorCost,
        total_margin: fin.totalMargin
      };

      // Atomic Update: Wipe and replace items
      await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', quoteId);
      const newItems = fin.processedItems.map(item => ({
        quotation_id: quoteId,
        item_type: item.type || 'other',
        description: item.description,
        amount: item.amount,
        vendor_cost: item.vendor_cost,
        sort_order: item.sort_order
      }));
      await supabaseAdmin.from('quotation_items').insert(newItems);

      // ── FINANCIAL SYNC ──
      // Industrial Logic: Automatically update the Lead's projected revenue and margin
      // This ensures CRM dashboards are accurate without manual intervention.
      await supabaseAdmin.from('leads').update({
        final_price: fin.total,
        vendor_cost: fin.totalVendorCost,
        margin: fin.totalMargin,
        updated_at: new Date().toISOString()
      }).eq('id', current.lead_id);
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

  /**
   * Industrialized Soft Delete: Proposal Removal
   */
  async deleteQuotation(tenantId, quoteId) {
    return await softDeleteDirect(supabaseAdmin, 'quotations', quoteId, tenantId);
  }

  async _handleLeadStatus(tenantId, userId, leadId, currentStatus, quoteNo, total) {
    if (['new', 'qualified'].includes(currentStatus)) {
      await supabaseAdmin.from('leads').update({ status: 'quoted' }).eq('id', leadId);
    }
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: tenantId, entity_type: 'lead', entity_id: leadId, user_id: userId,
      action: 'quotation_created',
      changes: { quote_number: quoteNo, total }
    });
  }

  async _checkMilestone(userId) {
    const { data: userProfile } = await supabaseAdmin.from('users').select('milestones').eq('id', userId).single();
    if (userProfile && !(userProfile.milestones || []).includes('first_quotation')) {
      await supabaseAdmin.from('users').update({ milestones: [...(userProfile.milestones || []), 'first_quotation'] }).eq('id', userId);
    }
  }
}

export default new QuotationService();
