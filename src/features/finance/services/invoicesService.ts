import { supabase } from '@/core/lib/supabase';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceFilters, PaymentTransaction } from '../types/invoice';
import { quotationsService } from './quotationsService';

export const invoicesService = {
  async getInvoices(tenantId: string, filters?: InvoiceFilters) {
    // 0. Auto-check overdue before fetch
    await this.checkOverdue(tenantId);

    let query = supabase
      .from('invoices')
      .select('*, customer:customers(name), quotation:quotations(quote_number)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters) {
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.overdue) query = query.eq('status', 'overdue');
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Invoice[];
  },

  async getInvoiceById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), customer:customers(*), quotation:quotations(id, quote_number), payments:payment_transactions(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (data.items) data.items.sort((a: any, b: any) => a.sort_order - b.sort_order);
    return data as Invoice;
  },

  async createInvoice(data: Partial<Invoice>, items: Partial<InvoiceItem>[]) {
    const tenantId = data.tenant_id;
    if (!tenantId) throw new Error('Tenant ID required');

    // 1. Generate Invoice Number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    const year = new Date().getFullYear();
    const sequence = String((count || 0) + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${sequence}`;

    // 2. Insert Invoice
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .insert({ ...data, invoice_number: invoiceNumber })
      .select()
      .single();

    if (iError) throw iError;

    // 3. Insert Items
    if (items.length > 0) {
      const { error: itError } = await supabase
        .from('invoice_items')
        .insert(items.map((item, index) => ({
          ...item,
          invoice_id: invoice.id,
          tenant_id: tenantId,
          sort_order: index
        })));
      if (itError) throw itError;
    }

    await this.recalculate(invoice.id);
    return this.getInvoiceById(invoice.id);
  },

  async createFromQuotation(quotationId: string) {
    const quote = await quotationsService.getQuotationById(quotationId);
    
    // Fetch tenant GSTIN
    const { data: tenant } = await supabase.from('tenants').select('gstin').eq('id', quote.tenant_id).single();

    const invoiceData: Partial<Invoice> = {
      tenant_id: quote.tenant_id,
      quotation_id: quote.id,
      lead_id: quote.lead_id,
      customer_id: quote.customer_id,
      title: quote.title,
      destination: quote.destination,
      travel_date_start: quote.travel_date_start,
      travel_date_end: quote.travel_date_end,
      pax_adults: quote.pax_adults,
      pax_children: quote.pax_children,
      pax_infants: quote.pax_infants,
      status: 'draft',
      invoice_date: new Date().toISOString().split('T')[0],
      discount_type: quote.discount_type,
      discount_value: quote.discount_value,
      gst_rate: quote.gst_rate,
      terms: quote.terms,
      gstin_supplier: tenant?.gstin,
      is_igst: false 
    };

    const items = (quote.items || []).map(item => ({
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      cost_price: item.cost_price,
      is_optional: item.is_optional,
      notes: item.notes
    }));

    return this.createInvoice(invoiceData, items);
  },

  async recordPayment(data: Partial<PaymentTransaction>) {
    const { data: payment, error: pError } = await supabase
      .from('payment_transactions')
      .insert(data)
      .select()
      .single();
    if (pError) throw pError;

    // Refresh totals and status
    await this.recalculate(data.invoice_id!);
    return this.getInvoiceById(data.invoice_id!);
  },

  async deletePayment(paymentId: string, invoiceId: string) {
    const { error } = await supabase
      .from('payment_transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;
    
    await this.recalculate(invoiceId);
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'paid') updates.paid_at = new Date().toISOString();

    const { error } = await supabase.from('invoices').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteInvoice(id: string) {
    const { data: inv } = await supabase.from('invoices').select('status').eq('id', id).single();
    if (inv?.status !== 'draft' && inv?.status !== 'cancelled') {
        throw new Error('Cannot delete an active invoice. Cancel it instead.');
    }
    const { error } = await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async recalculate(invoiceId: string) {
    const { data: inv } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('invoice_id', invoiceId)
      .is('deleted_at', null);
    
    if (!inv || !items) return;

    let subtotal = 0;
    let costPrice = 0;
    items.forEach(item => {
      subtotal += (item.quantity * item.selling_price);
      costPrice += (item.quantity * item.cost_price);
    });

    let discountAmount = 0;
    if (inv.discount_type === 'percentage') discountAmount = subtotal * (inv.discount_value / 100);
    else if (inv.discount_type === 'flat') discountAmount = inv.discount_value;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    let cgst_rate = 0, sgst_rate = 0, igst_rate = 0;
    let cgst_amount = 0, sgst_amount = 0, igst_amount = 0;

    if (inv.is_igst) {
      igst_rate = inv.gst_rate;
      igst_amount = taxableAmount * (igst_rate / 100);
    } else {
      cgst_rate = inv.gst_rate / 2;
      sgst_rate = inv.gst_rate / 2;
      cgst_amount = taxableAmount * (cgst_rate / 100);
      sgst_amount = taxableAmount * (sgst_rate / 100);
    }

    const gstAmount = cgst_amount + sgst_amount + igst_amount;
    const totalAmount = taxableAmount + gstAmount;

    const amountPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const amountOutstanding = totalAmount - amountPaid;

    let status = inv.status;
    if (amountPaid > 0 && amountPaid < totalAmount - 1) status = 'partially_paid';
    else if (amountPaid >= totalAmount - 1) status = 'paid';

    await supabase.from('invoices').update({
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      taxable_amount: Math.round(taxableAmount * 100) / 100,
      gst_amount: Math.round(gstAmount * 100) / 100,
      cgst_rate, sgst_rate, igst_rate,
      cgst_amount: Math.round(cgst_amount * 100) / 100,
      sgst_amount: Math.round(sgst_amount * 100) / 100,
      igst_amount: Math.round(igst_amount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      amount_paid: Math.round(amountPaid * 100) / 100,
      amount_outstanding: Math.round(amountOutstanding * 100) / 100,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', invoiceId);
  },

  async checkOverdue(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('invoices')
      .update({ status: 'overdue' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .in('status', ['sent', 'partially_paid'])
      .lt('due_date', today);
  }
};
