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
    const { booking_id, cancellation_reason, charge_amount, refund_amount, ...rest } = payload;
    if (!booking_id) throw new Error('booking_id is required');

    // Industrial ID Resolution
    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualUserId = userRec?.id || userId;

    const cancellationCharge = Number(charge_amount || rest.cancellation_charge) || 0;
    
    // Industrial Mapping: Strip fields not in Table
    const dbPayload = {
      tenant_id: tenantId,
      booking_id,
      reason: cancellation_reason || rest.reason,
      cancellation_charge: cancellationCharge,
      refund_amount_client: refund_amount || rest.refund_amount_client || 0,
      cancelled_by: actualUserId
    };

    const { data: cancellation, error } = await supabaseAdmin
      .from('cancellations')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    
    // Fetch old booking for audit
    const { data: oldBooking } = await supabaseAdmin.from('bookings').select('*').eq('id', booking_id).single();

    // Orchestration: Update Booking state
    const { data: newBooking } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    // Industrial Audit: Record status mutation to 'cancelled'
    await supabaseAdmin.from('financial_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'booking',
      entity_id: booking_id,
      field_changed: 'status',
      old_value: oldBooking.status,
      new_value: 'cancelled',
      snapshot_before: oldBooking,
      snapshot_after: newBooking,
      changed_at: new Date().toISOString(),
      user_id: actualUserId
    }).throwOnError();

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

  async _auditMutation(tenantId, userId, entityType, entityId, oldSnapshot, newSnapshot) {
    const priceFields = ['refundable_amount', 'cancellation_charge', 'vendor_refund_received'];
    for (const field of priceFields) {
      if (newSnapshot[field] !== undefined && parseFloat(newSnapshot[field] || 0) !== parseFloat(oldSnapshot[field] || 0)) {
        await supabaseAdmin.from('financial_audit_log').insert({
          tenant_id: tenantId,
          entity_type: entityType,
          entity_id: entityId,
          field_changed: field,
          old_value: oldSnapshot[field] || 0,
          new_value: newSnapshot[field],
          snapshot_before: oldSnapshot,
          snapshot_after: newSnapshot,
          changed_at: new Date().toISOString(),
          user_id: userId
        }).throwOnError();
      }
    }
  }
}

export default new CancellationService();
