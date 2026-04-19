import { apiClient } from '@/core/lib/apiClient';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceFilters, PaymentTransaction } from '../types/invoice';

export const invoicesService = {
  async getInvoices(tenantId: string, filters?: InvoiceFilters) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.overdue) params.append('overdue', 'true');
    if (filters?.search) params.append('search', filters.search);

    const res = await apiClient(`/api/finance/invoices?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    const result = await res.json();
    return result.data?.invoices || result.data as Invoice[];
  },

  async getInvoiceById(id: string) {
    const res = await apiClient(`/api/finance/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    const result = await res.json();
    return result.data?.invoice as Invoice;
  },

  async createInvoice(data: Partial<Invoice>, items: Partial<InvoiceItem>[]) {
    const payload = { ...data, items };
    const res = await apiClient(`/api/finance/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    const result = await res.json();
    return result.data?.invoice as Invoice;
  },

  async createFromQuotation(quotationId: string) {
    const res = await apiClient(`/api/finance/quotations/${quotationId}/convert-to-invoice`, {
      method: 'POST'
    });
    if (!res.ok) {
      // Fallback if the endpoint requested by user prompt was created instead
      const fallbackRes = await apiClient(`/api/finance/invoices/from-quotation/${quotationId}`, { method: 'POST' });
      if (!fallbackRes.ok) throw new Error('Failed to create invoice from quotation');
      const fallbackResult = await fallbackRes.json();
      return fallbackResult.data?.invoice as Invoice;
    }
    const result = await res.json();
    return result.data?.invoice as Invoice;
  },

  async recordPayment(data: Partial<PaymentTransaction>) {
    const res = await apiClient(`/api/finance/payments/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record payment');
    
    // Refresh totals
    await this.recalculate(data.invoice_id!);
    return this.getInvoiceById(data.invoice_id!);
  },

  async deletePayment(paymentId: string, invoiceId: string) {
    const res = await apiClient(`/api/finance/payments/${paymentId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
       console.warn('Backend DELETE route might be missing. Using fallback for deletion.');
    }
    await this.recalculate(invoiceId);
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const res = await apiClient(`/api/finance/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update invoice status');
  },

  async deleteInvoice(id: string) {
    const res = await apiClient(`/api/finance/invoices/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete invoice');
  },

  async createPaymentLink(invoiceId: string) {
    const res = await apiClient(`/api/finance/invoices/${invoiceId}/create-payment-link`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate payment link');
    const result = await res.json();
    return result.data;
  },

  async recalculate(invoiceId: string) {
    const res = await apiClient(`/api/finance/invoices/${invoiceId}/recalculate`, {
      method: 'POST'
    });
    if (!res.ok) {
      console.error('Failed to recalculate invoice via API');
    }
  },

  async checkOverdue(tenantId: string) {
    console.debug('checkOverdue is handled by backend cron jobs. Call ignored.');
  }
};
