import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

/**
 * CustomerService — 360° Customer Intelligence Hub
 * 
 * The customer is the center of gravity for every travel agency.
 * Every lead, booking, invoice, visa, and document connects back here.
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
    // Return EVERYTHING — this is the 360° profile
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!customer) return null;

    // Fetch associated travelers
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
   * Get all bookings for a customer
   */
  async getCustomerBookings(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_ref, customer_name, destination, travel_start_date, travel_end_date, traveler_count, total_cost, total_selling_price, amount_collected, status, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all quotations for a customer
   */
  async getCustomerQuotations(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('quotations')
      .select('id, quote_number, customer_name, destination, start_date, end_date, total_vendor_cost, total_margin, total, status, version, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all invoices for a customer
   */
  async getCustomerInvoices(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, customer_name, total, amount_paid, amount_due, status, invoice_type, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all visa records for a customer
   */
  async getCustomerVisas(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('visa_tracking')
      .select('id, traveler_name, applicant_name, destination, visa_type, passport_number, status, submission_date, expected_date, approved_date, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all documents for a customer
   */
  async getCustomerDocuments(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, title, category, file_url, file_type, file_size, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

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

  async getCustomerTimeline(tenantId, customerId) {
    const [
      { data: leads },
      { data: bookings },
      { data: engagement },
      { data: visas },
      { data: invoices }
    ] = await Promise.all([
      supabaseAdmin.from('leads').select('id, destination, status, final_price, created_at').eq('customer_id', customerId).eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabaseAdmin.from('bookings').select('id, booking_ref, destination, status, total_selling_price, created_at').eq('customer_id', customerId).eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabaseAdmin.from('engagement_log').select('id, engagement_type, channel, message_sent, created_at').eq('customer_id', customerId).eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('visa_tracking').select('id, destination, status, visa_type, updated_at').eq('customer_id', customerId).eq('tenant_id', tenantId).is('deleted_at', null).order('updated_at', { ascending: false }),
      supabaseAdmin.from('invoices').select('id, invoice_number, total, amount_paid, status, created_at').eq('customer_id', customerId).eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false })
    ]);

    const leadIds = (leads || []).map(l => l.id);
    let payments = [];
    if (leadIds.length > 0) {
      const { data: payData } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, amount, direction, transaction_date, description')
        .eq('tenant_id', tenantId)
        .in('lead_id', leadIds)
        .order('transaction_date', { ascending: false });
      payments = payData || [];
    }

    const timeline = [];
    (leads || []).forEach(l => timeline.push({ type: 'lead', title: `Enquiry: ${l.destination}`, description: `Status: ${l.status}${l.final_price ? ` · ₹${l.final_price}` : ''}`, timestamp: l.created_at, ref: l.id }));
    (bookings || []).forEach(b => timeline.push({ type: 'booking', title: `Trip Booked: ${b.destination}`, description: `Ref: ${b.booking_ref} · ${b.status}${b.total_selling_price ? ` · ₹${b.total_selling_price}` : ''}`, timestamp: b.created_at, ref: b.id }));
    (invoices || []).forEach(i => timeline.push({ type: 'invoice', title: `Invoice ${i.invoice_number}`, description: `₹${i.total} · ${i.status}${i.amount_paid ? ` · Paid: ₹${i.amount_paid}` : ''}`, timestamp: i.created_at, ref: i.id }));
    (payments || []).forEach(p => timeline.push({ type: 'payment', title: `Payment ${p.direction === 'in' ? 'Received' : 'Sent'}`, description: `₹${p.amount}${p.description ? ' — ' + p.description : ''}`, timestamp: p.transaction_date, ref: p.id }));
    (engagement || []).forEach(e => timeline.push({ type: 'engagement', title: `${e.engagement_type}`, description: `Via ${e.channel}: ${e.message_sent || 'Automated'}`, timestamp: e.created_at, ref: e.id }));
    (visas || []).forEach(v => timeline.push({ type: 'visa', title: `Visa: ${v.destination} (${v.visa_type || 'Tourist'})`, description: `Status: ${v.status}`, timestamp: v.updated_at, ref: v.id }));

    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return timeline;
  }

  async anonymizeCustomer(tenantId, customerId) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        name: 'Anonymized User',
        phone: '0000000000',
        alt_phone: null,
        email: 'anonymized@privacy.invalid',
        address: 'Anonymized for Privacy',
        passport_number: null,
        pan_number: null,
        gst_number: null,
        aadhar_number: null,
        consent_profile: { marketing: false, processing: false, revoked_at: new Date().toISOString() },
        preferences: {},
        passport_details: null,
        notes: null
      })
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new CustomerService();
