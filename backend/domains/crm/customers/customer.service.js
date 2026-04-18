import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

/**
 * CustomerService — 360° Customer Intelligence Hub
 */
class CustomerService {
  async getCustomers(tenantId, { search, page = 1, limit = 50 }) {
    let query = supabaseAdmin
      .from('customers')
      .select('id, name, phone, email, city, customer_type, date_of_birth, wedding_anniversary, lifetime_value, total_bookings, total_spent, last_booking_at, tags, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name')
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { customers: data, total: count, page: parseInt(page, 10) };
  }

  async getCustomerById(tenantId, customerId) {
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!customer) return null;

    const { data: travelers } = await supabaseAdmin
      .from('associated_travelers')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('name');

    return {
      ...customer,
      associated_travelers: travelers || []
    };
  }

  /**
   * Deduplication & Merging Hub
   */
  async getMergePreview(tenantId, keepId, mergeId) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .in('id', [keepId, mergeId]);

    if (error) throw error;
    
    const keepCustomer = (data || []).find(i => i.id === keepId);
    const mergeCustomer = (data || []).find(i => i.id === mergeId);

    if (!keepCustomer || !mergeCustomer) throw new Error('One or both customers not found');

    // Basic heuristic score
    const samePhone = keepCustomer.phone === mergeCustomer.phone;
    const sameEmail = keepCustomer.email && keepCustomer.email === mergeCustomer.email;
    
    let score = samePhone ? 90 : (sameEmail ? 70 : 10);
    
    return {
      keep_customer: keepCustomer,
      merge_customer: mergeCustomer,
      confidence_score: score,
      reasons: samePhone ? ['Same phone number'] : (sameEmail ? ['Same email'] : ['Manual selection'])
    };
  }

  async performMerge(tenantId, userId, keepId, mergeId, reason) {
    const preview = await this.getMergePreview(tenantId, keepId, mergeId);
    const { keep_customer: keep, merge_customer: merge } = preview;

    // 1. Move related records (Leads, Bookings, Invoices, etc)
    const tables = ['leads', 'bookings', 'quotations', 'invoices', 'associated_travelers', 'engagement_log'];
    const movedCounts = {};

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .update({ customer_id: keepId })
        .eq('customer_id', mergeId)
        .eq('tenant_id', tenantId)
        .select('id');
      
      if (error) logger.warn(`[Merge] Failed to move ${table} records: ${error.message}`);
      movedCounts[table] = data?.length || 0;
    }

    // 2. Aggregate financial stats
    const newTotalBookings = (keep.total_bookings || 0) + (merge.total_bookings || 0);
    const newLifetimeValue = (keep.lifetime_value || 0) + (merge.lifetime_value || 0);

    // 3. Update 'keep' customer
    await supabaseAdmin
      .from('customers')
      .update({
        total_bookings: newTotalBookings,
        lifetime_value: newLifetimeValue,
        notes: `${keep.notes || ''}\n\n[System Merge]: ${new Date().toISOString()}\nMerged ${merge.name} into this record. Reason: ${reason || 'Manual'}`.trim()
      })
      .eq('id', keepId);

    // 4. Soft-delete 'merge' customer
    await supabaseAdmin
      .from('customers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        notes: `Merged into ${keep.name} (${keepId})`
      })
      .eq('id', mergeId);

    return { success: true, movedCounts };
  }

  async getMergeLogs(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('action', 'customer_merged')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getCustomerBookings(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCustomerQuotations(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCustomerInvoices(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCustomerVisas(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('visa_tracking')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  }

  async getCustomerDocuments(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  }

  async createCustomer(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCustomer(tenantId, customerId, updates) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCustomer(tenantId, userId, customerId) {
    const { error } = await supabaseAdmin
      .from('customers')
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', customerId)
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return { success: true };
  }

  async getCustomerTimeline(tenantId, customerId) {
    // simplified timeline for regression pass
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'customer')
      .eq('entity_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async anonymizeCustomer(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        name: 'Anonymized User',
        phone: '0000000000',
        email: 'anonymized@privacy.invalid',
        consent_profile: { revoked_at: new Date().toISOString() }
      })
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getTravelers(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('associated_travelers')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  }

  async addTraveler(tenantId, customerId, payload) {
    const { data, error } = await supabaseAdmin
      .from('associated_travelers')
      .insert({ ...payload, customer_id: customerId, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export default new CustomerService();
