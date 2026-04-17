import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import { toAmount } from '../../../core/utils/helpers.js';
import logger from '../../../core/utils/logger.js';

/**
 * BookingService — Definitive Fulfillment & Hub Orchestration
 */
class BookingService {
  /**
   * Fetch Global Booking Hub (Optimized RPC)
   */
  async getBookingHub(tenantId, bookingId) {
    // Attempt high-performance RPC first
    const { data: hub, error: rpcErr } = await supabaseAdmin.rpc('get_booking_hub_v1', {
      p_tenant_id: tenantId,
      p_booking_id: bookingId
    });

    if (rpcErr) {
      logger.warn({ err: rpcErr, bookingId }, 'Booking Hub RPC failed. Falling back to sequential fetch.');
      return this._getHubFallback(tenantId, bookingId);
    }

    if (!hub) return null;
    
    // Add additional processing (like timeline sorting) if needed
    hub.timeline = this._buildTimeline(hub);
    return hub;
  }

  /**
   * Create a new booking
   */
  async createBooking(tenantId, userId, payload) {
    const booking_ref = `BK-${Date.now()}`;
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        ...payload,
        tenant_id: tenantId,
        booking_ref,
        created_by: userId,
        status: payload.status || 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;
    return booking;
  }

  /**
   * Update booking with state machine enforcement
   */
  async updateBooking(tenantId, bookingId, updates) {
    if (updates.status) {
      await this._validateStatusTransition(tenantId, bookingId, updates.status);
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add Service to Booking
   */
  async addService(tenantId, bookingId, serviceData) {
    const payload = {
      ...serviceData,
      booking_id: bookingId,
      tenant_id: tenantId,
      cost_to_agency: toAmount(serviceData.cost_to_agency),
      price_to_client: toAmount(serviceData.price_to_client)
    };

    const { data, error } = await supabaseAdmin
      .from('booking_services')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    
    // Industrialized financial sync
    if (data.supplier_id) {
      await this.recalculateSupplierFinancials(tenantId, data.supplier_id);
    }

    return data;
  }

  /**
   * Global Financial Sync for Agents/Suppliers
   */
  async recalculateSupplierFinancials(tenantId, supplierId) {
    if (!supplierId) return;

    const { data: services, error } = await supabaseAdmin
      .from('booking_services')
      .select('cost_to_agency, paid_to_supplier_amount, payable_due_date, commission_amount')
      .eq('tenant_id', tenantId)
      .eq('supplier_id', supplierId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats = (services || []).reduce((acc, item) => {
      const cost = toAmount(item.cost_to_agency);
      const paid = toAmount(item.paid_to_supplier_amount);
      acc.total += cost;
      acc.outstanding += Math.max(0, cost - paid);
      acc.commission += toAmount(item.commission_amount);
      if (cost > paid && item.payable_due_date) {
        if (!acc.nextDue || item.payable_due_date < acc.nextDue) {
          acc.nextDue = item.payable_due_date;
        }
      }
      return acc;
    }, { total: 0, outstanding: 0, commission: 0, nextDue: null });

    await supabaseAdmin
      .from('agents_directory')
      .update({
        outstanding_payables: stats.outstanding,
        total_business_value: stats.total,
        commission_earned: stats.commission,
        next_payment_due_at: stats.nextDue
      })
      .eq('id', supplierId)
      .eq('tenant_id', tenantId);
  }

  /**
   * Internal Fallback for Lead-less environments or RPC failures
   */
  async _getHubFallback(tenantId, bookingId) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, customers(*), leads(*)')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !booking) return null;

    const [services, invoice, quotation] = await Promise.all([
      supabaseAdmin.from('booking_services').select('*').eq('booking_id', bookingId).eq('tenant_id', tenantId).is('deleted_at', null),
      booking.invoice_id ? supabaseAdmin.from('invoices').select('*, invoice_items(*)').eq('id', booking.invoice_id).single() : Promise.resolve({ data: null }),
      booking.quotation_id ? supabaseAdmin.from('quotations').select('*, quotation_items(*)').eq('id', booking.quotation_id).single() : Promise.resolve({ data: null })
    ]);

    return {
      booking,
      services: services.data || [],
      invoice: invoice.data,
      quotation: quotation.data,
      timeline: [] // Simplified fallback
    };
  }

  _buildTimeline(hub) {
    const timeline = [];
    const push = (date, type, title, desc) => {
      if (date) timeline.push({ date, type, title, description: desc });
    };

    if (hub.booking) {
      push(hub.booking.created_at, 'booking', 'Booking Created', `Ref: ${hub.booking.booking_ref}`);
      push(hub.booking.travel_start_date, 'travel', 'Travel Starts', hub.booking.destination);
    }

    (hub.payments || []).forEach(p => push(p.transaction_date, 'payment', 'Payment Logged', `${p.amount} ${p.direction}`));
    
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async _validateStatusTransition(tenantId, bookingId, newStatus) {
    const VALID_TRANSITIONS = {
      enquiry:    ['confirmed', 'cancelled'],
      confirmed:  ['in_progress', 'cancelled'],
      in_progress:['completed', 'cancelled'],
      completed:  [],
      cancelled:  ['confirmed'],
    };

    const { data: current } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .single();

    if (current && VALID_TRANSITIONS[current.status] && !VALID_TRANSITIONS[current.status].includes(newStatus)) {
      throw new Error(`Invalid transition from ${current.status} to ${newStatus}`);
    }
  }

  /**
   * List bookings with multi-tenant filtering and pagination
   */
  async listBookings(tenantId, filters) {
    const { status, customer_id, lead_id, from, to, page = 1, limit = 50 } = filters;
    
    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (from) query = query.gte('travel_start_date', from);
    if (to) query = query.lte('travel_end_date', to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { bookings: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Global PNR discovery and service tracking
   */
  async getPnrTracker(tenantId, filters) {
    const { search, status } = filters;
    let query = supabaseAdmin
      .from('booking_services')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('confirmation_number', 'is', null)
      .order('service_start_date', { ascending: true });

    if (status) query = query.eq('supplier_payment_status', status);
    if (search) query = query.or(`confirmation_number.ilike.%${search}%,service_title.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export default new BookingService();
