import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';

/**
 * CancellationService — Financial Reversals & Refund Orchestration
 */
class CancellationService {
  /**
   * List of cancellation requests with hydrated booking context
   */
  async listCancellations(tenantId, filters) {
    const { status, booking_id } = filters;
    let query = supabaseAdmin
      .from('cancellations')
      .select('*, bookings(booking_ref, customer_name, destination)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (booking_id) query = query.eq('booking_id', booking_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Track outstanding refunds from vendors
   */
  async getRefundTracker(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('cancellations')
      .select('*, bookings(booking_ref, customer_name)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .neq('status', 'refunded');

    if (error) throw error;
    const totalGap = (data || []).reduce((sum, item) => sum + (Number(item.refundable_amount) - Number(item.vendor_refund_received)), 0);
    return { refund_tracker: data || [], total_refund_gap: Math.max(0, totalGap) };
  }

  /**
   * Process a new cancellation (Atomic Booking update)
   */
  async createCancellation(tenantId, userId, payload) {
    const { booking_id } = payload;
    if (!booking_id) throw new Error('booking_id is required');

    const originalAmount = Number(payload.original_amount) || 0;
    const cancellationCharge = Number(payload.cancellation_charge) || 0;
    const refundableAmount = Math.max(0, originalAmount - cancellationCharge);
    
    const { data: cancellation, error } = await supabaseAdmin
      .from('cancellations')
      .insert({
        ...payload,
        tenant_id: tenantId,
        original_amount: originalAmount,
        cancellation_charge: cancellationCharge,
        refundable_amount: refundableAmount,
        status: payload.status || 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Orchestration: Update Booking state and financials
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        total_selling_price: cancellationCharge // Booking value is now effectively just the charge
      })
      .eq('id', booking_id)
      .eq('tenant_id', tenantId);

    return cancellation;
  }

  /**
   * Update cancellation workflow status
   */
  async updateStatus(tenantId, cancellationId, payload) {
    const updates = { ...payload, updated_at: new Date().toISOString() };
    if (payload.status === 'refunded') {
       updates.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('cancellations')
      .update(updates)
      .eq('id', cancellationId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Specifically record refund receipt from Vendor
   */
  async recordRefundReceived(tenantId, cancellationId, receivedAmount) {
    const received = Number(receivedAmount) || 0;

    const { data: updated, error } = await supabaseAdmin
      .from('cancellations')
      .update({
        vendor_refund_received: received,
        status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', cancellationId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  /**
   * Soft Delete Cancellation record
   */
  async deleteCancellation(tenantId, userId, cancellationId) {
    return await softDeleteDirect(supabaseAdmin, 'cancellations', cancellationId, tenantId);
  }
}

export default new CancellationService();
