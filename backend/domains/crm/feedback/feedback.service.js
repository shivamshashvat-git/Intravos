import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * FeedbackService — Post-Trip Relationship Governance
 */
class FeedbackService {
  /**
   * List specialized feedback records
   */
  async listFeedback(tenantId, filters) {
    const { booking_id, customer_id, status, min_rating } = filters;

    let query = supabaseAdmin
      .from('post_trip_feedback')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (booking_id) query = query.eq('booking_id', booking_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('request_status', status);
    if (min_rating) query = query.gte('overall_rating', parseInt(min_rating, 10));

    const { data, error, count } = await query;
    if (error) throw error;

    return { feedback: data || [], total: count || 0 };
  }

  /**
   * Orchestrate new feedback collection request
   */
  async requestFeedback(tenantId, userId, payload) {
    const { booking_id } = payload;
    if (!booking_id) throw new Error('booking_id is required');

    // Verify booking existence and ownership
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, destination')
      .eq('id', booking_id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (bookingError) throw bookingError;
    if (!booking) throw new Error('Booking not found');

    const { data, error } = await supabaseAdmin
      .from('post_trip_feedback')
      .insert({
        tenant_id: tenantId,
        booking_id,
        customer_id: booking.customer_id,
        destination_snapshot: booking.destination || null,
        request_status: 'sent',
        requested_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Public-facing submission orchestrator
   */
  async submitFeedback(token, payload) {
    const updates = {
      request_status: 'submitted',
      submitted_at: new Date().toISOString(),
      overall_rating: payload.overall_rating || null,
      hotel_rating: payload.hotel_rating || null,
      activity_rating: payload.activity_rating || null,
      transfer_rating: payload.transfer_rating || null,
      guide_rating: payload.guide_rating || null,
      what_went_well: payload.what_went_well || null,
      what_could_improve: payload.what_could_improve || null,
      would_recommend: payload.would_recommend ?? null,
      testimonial_consent: payload.testimonial_consent === true,
      testimonial_text: payload.testimonial_text || null
    };

    const { data, error } = await supabaseAdmin
      .from('post_trip_feedback')
      .update(updates)
      .eq('feedback_token', token)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) throw new Error('Feedback request not found');
    return data;
  }

  /**
   * Retire feedback record
   */
  async deleteFeedback(tenantId, userId, feedbackId) {
    return await softDeleteDirect({
      table: 'post_trip_feedback',
      id: feedbackId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Post-trip feedback'
    });
  }
}

export default new FeedbackService();
