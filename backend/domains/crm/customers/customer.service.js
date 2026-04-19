import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { refreshCustomerHealth } from '../analytics/clientHealth.js';

/**
 * CustomerService — Industrialized CRM Core
 */
class CustomerService {
  
  // ── CORE CRUD ──

  async getCustomers(tenantId, { search, customer_type, tags, page = 1, limit = 50 }) {
    let query = supabaseAdmin
      .from('customers')
      .select('*, travel_consultant:users!created_by(name)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (customer_type && customer_type !== 'all') {
      query = query.eq('customer_type', customer_type);
    }
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { customers: data, total: count, page: parseInt(page, 10) };
  }

  async getCustomerById(tenantId, customerId) {
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*, travel_consultant:users!created_by(name)')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return customer;
  }

  async createCustomer(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;

    // Log engagement (creation event)
    await this.logEngagement(tenantId, data.id, payload.created_by, 'profile_created', 'system');
    
    return data;
  }

  async updateCustomer(tenantId, customerId, updates) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
      .update({ 
        deleted_at: new Date().toISOString(), 
        deleted_by: userId 
      })
      .eq('id', customerId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return { success: true };
  }

  // ── ASSOCIATED TRAVELERS ──

  async getTravelers(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('associated_travelers')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data;
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

  // ── ANALYTICS & DEDUPLICATION ──

  async getDuplicatePhones(tenantId) {
    const { data, error } = await supabaseAdmin.rpc('find_duplicate_phones', { p_tenant_id: tenantId });
    if (error) throw error;

    // Fetch customer details for these phones
    if (!data || data.length === 0) return [];

    const results = await Promise.all(data.map(async (row) => {
      const { data: details } = await supabaseAdmin
        .from('customers')
        .select('id, name, phone, email, created_at')
        .in('id', row.customer_ids)
        .eq('tenant_id', tenantId);
      
      return {
        phone: row.phone,
        count: row.customer_ids.length,
        customers: details
      };
    }));

    return results;
  }

  // ── ENGAGEMENT ENGINE ──

  async getUpcomingBirthdays(tenantId) {
    // Birthdays in next 7 days
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, email, date_of_birth')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    
    if (error) throw error;

    const today = new Date();
    return (data || []).filter(c => {
      if (!c.date_of_birth) return false;
      const dob = new Date(c.date_of_birth);
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      
      const diffTime = nextBirthday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
  }

  async getUpcomingAnniversaries(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, email, wedding_anniversary')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;

    const today = new Date();
    return (data || []).filter(c => {
      if (!c.wedding_anniversary) return false;
      const ann = new Date(c.wedding_anniversary);
      const nextAnn = new Date(today.getFullYear(), ann.getMonth(), ann.getDate());
      if (nextAnn < today) nextAnn.setFullYear(today.getFullYear() + 1);
      
      const diffTime = nextAnn.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
  }

  async getDormantCustomers(tenantId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, email, last_booking_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .lt('last_booking_at', sixMonthsAgo.toISOString());
    
    if (error) throw error;
    return data || [];
  }

  async logEngagement(tenantId, customerId, userId, eventType, channel, meta = {}) {
    const { error } = await supabaseAdmin
      .from('engagement_log')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        user_id: userId,
        event_type: eventType,
        channel: channel,
        meta
      });
    if (error) logger.error(`[EngagementLog] Failed: ${error.message}`);
  }

  // ── MESSAGE TEMPLATES ──

  async getMessageTemplates(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data;
  }

  async createMessageTemplate(tenantId, payload) {
    const { category, ...rest } = payload;
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .insert({ ...rest, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateMessageTemplate(tenantId, id, updates) {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteMessageTemplate(tenantId, id) {
    const { error } = await supabaseAdmin
      .from('message_templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return { success: true };
  }

  // ── FEEDBACK & REFERRALS ──

  async initiateFeedbackRequest(tenantId, userId, { booking_id, customer_id, feedback_type }) {
    const token = uuidv4();
    const { data, error } = await supabaseAdmin
      .from('post_trip_feedback')
      .insert({
        tenant_id: tenantId,
        booking_id,
        customer_id,
        feedback_token: token,
        request_status: 'sent',
        requested_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, public_url: `/feedback/${token}` };
  }

  async getFeedbackByToken(token) {
    const { data, error } = await supabaseAdmin
      .from('post_trip_feedback')
      .select('*, customer:customers(name, email), booking:bookings(booking_ref, destination)')
      .eq('feedback_token', token)
      .single();
    
    if (error) throw error;
    return data;
  }

  async submitFeedback(token, payload) {
    const { data, error } = await supabaseAdmin
      .from('post_trip_feedback')
      .update({
        ...payload,
        submitted_at: new Date().toISOString(),
        request_status: 'submitted'
      })
      .eq('feedback_token', token)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getReferrals(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createReferral(tenantId, payload) {
    const { commission_amount, ...rest } = payload;
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert({ ...rest, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateReferral(tenantId, id, updates) {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ── CUSTOMER HEALTH SCORING ──

  async calculateCustomerHealth(tenantId, customerId) {
    return refreshCustomerHealth(tenantId, customerId);
  }

  // ── RELATIONS ──

  async getCustomerBookings(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('travel_start_date', { ascending: false });
    if (error) throw error;
    return data;
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
    return data;
  }

  async getCustomerInvoices(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export default new CustomerService();
