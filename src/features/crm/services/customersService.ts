import { apiClient } from '@/core/lib/apiClient';
import { Customer, CustomerFilters, AssociatedTraveler } from '@/features/crm/types/customer';

/**
 * CustomersService — Frontend bridge to Industrialized Backend
 * No direct Supabase calls here. All auth logic is handled in apiClient.
 */
const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1/crm/customers';

export const customersService = {
  
  // ── CORE CRUD ──

  async getCustomers(filters?: CustomerFilters, page = 1, pageSize = 25) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.customer_type && filters.customer_type !== 'all') params.append('customer_type', filters.customer_type);
      if (filters.search) params.append('search', filters.search);
      if (filters.tags && filters.tags.length > 0) filters.tags.forEach(t => params.append('tags', t));
    }
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());

    const response = await apiClient(`${BASE}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch customers');

    const { data } = await response.json();
    return { 
      data: (data.customers || []) as (Customer & { health_score?: number })[], 
      total: data.total || 0 
    };
  },

  async getCustomerById(id: string) {
    const response = await apiClient(`${BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch customer profile');

    const { data } = await response.json();
    return {
      customer: data.customer as Customer,
      health: data.health || null,
      travelers: (data.customer.associated_travelers || []) as AssociatedTraveler[]
    };
  },

  async createCustomer(data: Partial<Customer>) {
    const response = await apiClient(BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create customer');

    const { data: result } = await response.json();
    return result.customer as Customer;
  },

  async updateCustomer(id: string, data: Partial<Customer>) {
    const response = await apiClient(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update customer');

    const { data: result } = await response.json();
    return result.customer as Customer;
  },

  async deleteCustomer(id: string) {
    const response = await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete customer');
    return true;
  },

  // ── TRAVELERS ──

  async getTravelers(customerId: string) {
    const response = await apiClient(`${BASE}/${customerId}/travelers`);
    if (!response.ok) throw new Error('Failed to fetch travelers');
    const { data } = await response.json();
    return data as AssociatedTraveler[];
  },

  async addTraveler(customerId: string, data: Partial<AssociatedTraveler>) {
    const response = await apiClient(`${BASE}/${customerId}/travelers`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add traveler');
    const { data: result } = await response.json();
    return result as AssociatedTraveler;
  },

  // ── CRM ENGINE FEATURES ──

  async getDuplicatePhones() {
    const response = await apiClient(`${BASE}/duplicate-phones`);
    if (!response.ok) throw new Error('Failed to fetch duplicates');
    const { data } = await response.json();
    return data;
  },

  async getUpcomingBirthdays() {
    const response = await apiClient(`${BASE}/engagement/birthdays`);
    const { data } = await response.json();
    return data;
  },

  async getUpcomingAnniversaries() {
    const response = await apiClient(`${BASE}/engagement/anniversaries`);
    const { data } = await response.json();
    return data;
  },

  async getDormantCustomers() {
    const response = await apiClient(`${BASE}/engagement/dormant`);
    const { data } = await response.json();
    return data;
  },

  // ── CONFIG & TEMPLATES ──

  async getMessageTemplates() {
    const response = await apiClient(`${BASE}/config/templates`);
    const { data } = await response.json();
    return data;
  },

  async createMessageTemplate(data: any) {
    const response = await apiClient(`${BASE}/config/templates`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const { data: result } = await response.json();
    return result;
  },

  // ── FEEDBACK & REFERRALS ──

  async requestFeedback(bookingId: string, customerId: string) {
    const response = await apiClient(`${BASE}/feedback/request`, {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, customer_id: customerId })
    });
    const { data } = await response.json();
    return data;
  },

  async getReferrals() {
    const response = await apiClient(`${BASE}/referrals`);
    const { data } = await response.json();
    return data;
  },

  async createReferral(data: any) {
    const response = await apiClient(`${BASE}/referrals`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const { data: result } = await response.json();
    return result;
  },

  // ── RELATIONS ──

  async getCustomerBookings(id: string) {
    const response = await apiClient(`${BASE}/${id}/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    const { data } = await response.json();
    return data;
  },

  async getCustomerQuotations(id: string) {
    const response = await apiClient(`${BASE}/${id}/quotations`);
    const { data } = await response.json();
    return data;
  },

  async getCustomerInvoices(id: string) {
    const response = await apiClient(`${BASE}/${id}/invoices`);
    const { data } = await response.json();
    return data;
  }
};
