import { supabase } from '@/core/lib/supabase';
import { Customer, CustomerFilters, AssociatedTraveler } from '@/features/crm/types/customer';

export const customersService = {
  async getCustomers(tenantId: string, filters?: CustomerFilters, page = 1, pageSize = 25) {
    let query = supabase
      .from('customers')
      .select('id, tenant_id, name, phone, email, city, customer_type, tags, total_spent, bookings_count, last_booking_at, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_archived', false)
      .is('deleted_at', null);

    if (filters) {
      if (filters.customer_type && filters.customer_type !== 'all') {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data as Customer[], count: count || 0 };
  },

  async getCustomerById(id: string) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (customerError) throw customerError;

    const { data: travelers, error: travelerError } = await supabase
      .from('associated_travelers')
      .select('*')
      .eq('customer_id', id)
      .is('deleted_at', null);

    if (travelerError) throw travelerError;

    return { customer: customer as Customer, travelers: (travelers || []) as AssociatedTraveler[] };
  },

  async createCustomer(data: Partial<Customer>) {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return customer as Customer;
  },

  async updateCustomer(id: string, data: Partial<Customer>) {
    const { data: customer, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return customer as Customer;
  },

  async archiveCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getAssociatedTravelers(customerId: string) {
    const { data, error } = await supabase
      .from('associated_travelers')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null);

    if (error) throw error;
    return data as AssociatedTraveler[];
  },

  async createAssociatedTraveler(data: Partial<AssociatedTraveler>) {
    const { data: traveler, error } = await supabase
      .from('associated_travelers')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return traveler as AssociatedTraveler;
  },

  async updateAssociatedTraveler(id: string, data: Partial<AssociatedTraveler>) {
    const { data: traveler, error } = await supabase
      .from('associated_travelers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return traveler as AssociatedTraveler;
  },

  async deleteAssociatedTraveler(id: string) {
    const { error } = await supabase
      .from('associated_travelers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getCustomerLeads(customerId: string, tenantId: string, phone?: string) {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
      
    if (phone) {
      query = query.or(`customer_id.eq.${customerId},customer_phone.eq.${phone}`);
    } else {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getCustomerQuotations(customerId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getCustomerInvoices(customerId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};
