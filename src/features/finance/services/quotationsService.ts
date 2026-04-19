import { apiClient } from '@/core/lib/apiClient';
import { Quotation, QuotationItem, QuotationStatus, QuotationFilters } from '../types/quotation';

export const quotationsService = {
  async getQuotations(tenantId: string, filters?: QuotationFilters) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.lead_id) params.append('lead_id', filters.lead_id);
    if (filters?.search) params.append('search', filters.search);

    const res = await apiClient(`/api/finance/quotations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch quotations');
    const result = await res.json();
    return result.data?.quotations || result.data as Quotation[];
  },

  async getQuotationById(id: string) {
    const res = await apiClient(`/api/finance/quotations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quotation');
    const result = await res.json();
    return result.data?.quotation as Quotation;
  },

  async createQuotation(data: Partial<Quotation>, items: Partial<QuotationItem>[]) {
    const payload = { ...data, items };
    const res = await apiClient(`/api/finance/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create quotation');
    const result = await res.json();
    return result.data?.quotation as Quotation;
  },

  async updateQuotation(id: string, data: Partial<Quotation>) {
    const res = await apiClient(`/api/finance/quotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update quotation');
    const result = await res.json();
    return result.data?.quotation as Quotation;
  },

  async updateQuotationItems(quotationId: string, tenantId: string, items: Partial<QuotationItem>[]) {
    const res = await apiClient(`/api/finance/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to update quotation items');
    const result = await res.json();
    return result.data?.quotation as Quotation;
  },

  async updateQuotationStatus(id: string, status: QuotationStatus) {
    const res = await apiClient(`/api/finance/quotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update quotation status');
  },

  async deleteQuotation(id: string) {
    const res = await apiClient(`/api/finance/quotations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete quotation');
  },

  async reviseQuotation(id: string) {
    const res = await apiClient(`/api/finance/quotations/${id}/revise`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to revise quotation');
    const result = await res.json();
    return result.data?.quotation?.id || result.data?.id; // return newly created revision ID
  },

  async recalculate(quotationId: string) {
    const res = await apiClient(`/api/finance/quotations/${quotationId}/recalculate`, {
      method: 'POST'
    });
    if (!res.ok) {
      console.error('Failed to recalculate quotation via API');
    }
  }
};
