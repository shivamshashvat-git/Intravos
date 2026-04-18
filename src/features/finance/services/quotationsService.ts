import { supabase } from '@/core/lib/supabase';
import { Quotation, QuotationItem, QuotationStatus, QuotationFilters } from '../types/quotation';

export const quotationsService = {
  async getQuotations(tenantId: string, filters?: QuotationFilters) {
    let query = supabase
      .from('quotations')
      .select('*, customer:customers(id, name), lead:leads(id, destination)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,quote_number.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Quotation[];
  },

  async getQuotationById(id: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, items:quotation_items(*), customer:customers(id, name, phone, email), lead:leads(id, destination)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (data.items) {
      data.items.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }
    return data as Quotation;
  },

  async createQuotation(data: Partial<Quotation>, items: Partial<QuotationItem>[]) {
    const tenantId = data.tenant_id;
    if (!tenantId) throw new Error('Tenant ID is required');

    // 1. Generate Quote Number
    const { count } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    const year = new Date().getFullYear();
    const sequence = String((count || 0) + 1).padStart(4, '0');
    const quoteNumber = `QT-${year}-${sequence}`;

    // 2. Insert Quotation
    const { data: quotation, error: qError } = await supabase
      .from('quotations')
      .insert({ ...data, quote_number: quoteNumber })
      .select()
      .single();

    if (qError) throw qError;

    // 3. Insert Items
    if (items.length > 0) {
      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(items.map((item, index) => ({
          ...item,
          quotation_id: quotation.id,
          tenant_id: tenantId,
          sort_order: index
        })));
      if (iError) throw iError;
    }

    // 4. Recalculate
    await this.recalculate(quotation.id);

    return this.getQuotationById(quotation.id);
  },

  async updateQuotation(id: string, data: Partial<Quotation>) {
    const { error } = await supabase
      .from('quotations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    
    await this.recalculate(id);
    return this.getQuotationById(id);
  },

  async updateQuotationItems(quotationId: string, tenantId: string, items: Partial<QuotationItem>[]) {
    // Delete existing
    const { error: dError } = await supabase
      .from('quotation_items')
      .delete()
      .eq('quotation_id', quotationId);
    if (dError) throw dError;

    // Insert new
    if (items.length > 0) {
      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(items.map((item, index) => ({
          ...item,
          quotation_id: quotationId,
          tenant_id: tenantId,
          sort_order: index
        })));
      if (iError) throw iError;
    }

    await this.recalculate(quotationId);
    return this.getQuotationById(quotationId);
  },

  async updateQuotationStatus(id: string, status: QuotationStatus) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'accepted') updates.accepted_at = new Date().toISOString();

    const { error } = await supabase.from('quotations').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteQuotation(id: string) {
    const { error } = await supabase
      .from('quotations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async reviseQuotation(id: string) {
    const original = await this.getQuotationById(id);
    
    // Create new revision
    const { data: revision, error: rError } = await supabase
      .from('quotations')
      .insert({
        tenant_id: original.tenant_id,
        lead_id: original.lead_id,
        customer_id: original.customer_id,
        title: original.title,
        destination: original.destination,
        travel_date_start: original.travel_date_start,
        travel_date_end: original.travel_date_end,
        pax_adults: original.pax_adults,
        pax_children: original.pax_children,
        pax_infants: original.pax_infants,
        quote_number: original.quote_number, // Same number, different version
        version: original.version + 1,
        parent_quote_id: original.id,
        status: 'draft',
        discount_type: original.discount_type,
        discount_value: original.discount_value,
        gst_rate: original.gst_rate,
        terms: original.terms
      })
      .select()
      .single();

    if (rError) throw rError;

    // Copy items
    if (original.items && original.items.length > 0) {
      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(original.items.map(item => ({
          tenant_id: item.tenant_id,
          quotation_id: revision.id,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          selling_price: item.selling_price,
          cost_price: item.cost_price,
          is_optional: item.is_optional,
          is_included: item.is_included,
          notes: item.notes,
          vendor_name: item.vendor_name,
          sort_order: item.sort_order
        })));
      if (iError) throw iError;
    }

    // Mark original as revised
    await supabase.from('quotations').update({ status: 'revised' }).eq('id', original.id);

    // Initial recalculate for revision
    await this.recalculate(revision.id);

    return revision.id;
  },

  async recalculate(quotationId: string) {
    // 1. Fetch items and quotation
    const { data: q } = await supabase.from('quotations').select('*').eq('id', quotationId).single();
    const { data: items } = await supabase.from('quotation_items').select('*').eq('quotation_id', quotationId);
    
    if (!q || !items) return;

    // 2. Sum included items
    let subtotal = 0;
    let costPrice = 0;
    
    items.forEach(item => {
      if (item.is_included) {
        subtotal += (item.quantity * item.selling_price);
        costPrice += (item.quantity * item.cost_price);
      }
    });

    // 3. Discount
    let discountAmount = 0;
    if (q.discount_type === 'percentage') {
      discountAmount = subtotal * (q.discount_value / 100);
    } else if (q.discount_type === 'flat') {
      discountAmount = q.discount_value;
    }

    // 4. Financial Calc
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = taxableAmount * (q.gst_rate / 100);
    const totalAmount = taxableAmount + gstAmount;

    // 5. Margin
    const totalVendorCost = costPrice;
    const totalMargin = totalAmount - totalVendorCost;
    const marginPercentage = totalAmount > 0 ? (totalMargin / totalAmount) * 100 : 0;

    // 6. Update
    await supabase.from('quotations').update({
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      taxable_amount: Math.round(taxableAmount * 100) / 100,
      gst_amount: Math.round(gstAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      selling_price: Math.round(totalAmount * 100) / 100,
      cost_price: Math.round(costPrice * 100) / 100,
      total_vendor_cost: Math.round(totalVendorCost * 100) / 100,
      total_margin: Math.round(totalMargin * 100) / 100,
      margin_percentage: Math.round(marginPercentage * 100) / 100,
      updated_at: new Date().toISOString()
    }).eq('id', quotationId);
  }
};
