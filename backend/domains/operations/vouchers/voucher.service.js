import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * VoucherService — Service Voucher & Vendor Fulfillment Orchestration
 */
class VoucherService {
  /**
   * Fetch rich voucher details with relations
   */
  async getById(tenantId, voucherId) {
    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .select(`
        *,
        bookings(
          booking_ref, 
          destination, 
          travel_start_date, 
          travel_end_date, 
          customer_id, 
          customers(name, phone, email)
        )
      `)
      .eq('id', voucherId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Transition Booking Service to Vouchered state
   */
  async generateVoucher(tenantId, userId, payload) {
    if (!payload.booking_service_id) throw new Error('booking_service_id is required');

    // 1. Fetch source service & booking
    const { data: service } = await supabaseAdmin
      .from('booking_services')
      .select('*')
      .eq('id', payload.booking_service_id)
      .eq('tenant_id', tenantId)
      .single();

    if (!service) throw new Error('Booking service not found');

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', service.booking_id)
      .eq('tenant_id', tenantId)
      .single();

    if (!booking) throw new Error('Booking not found');

    // 2. Prepare fulfillment metadata
    const guestNames = payload.guest_names || payload.guest_name || 'Guest';
    const travelDates = payload.travel_dates || `${service.service_start_date || booking.travel_start_date || ''} to ${service.service_end_date || booking.travel_end_date || ''}`;

    // 3. Create Voucher Record
    const { data: voucher, error: vError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        tenant_id: tenantId,
        booking_id: booking.id,
        booking_service_id: service.id,
        supplier_id: payload.supplier_id || service.supplier_id || null,
        guest_names: guestNames,
        travel_dates: travelDates,
        room_type: payload.room_type || service.room_type || null,
        meal_plan: payload.meal_plan || service.meal_plan || null,
        special_requests: payload.special_requests || service.special_requests || null,
        booking_reference: payload.booking_reference || service.confirmation_number || booking.booking_ref,
        agency_contact: payload.agency_contact || null,
        created_by: userId
      })
      .select()
      .single();

    if (vError) throw vError;

    // 4. Update Service State (Atomic side-effect)
    await supabaseAdmin
      .from('booking_services')
      .update({ 
        voucher_generated: true, 
        voucher_generated_at: new Date().toISOString() 
      })
      .eq('id', service.id)
      .eq('tenant_id', tenantId);

    return voucher;
  }

  /**
   * Finalize vendor dispatch
   */
  async markSent(tenantId, voucherId) {
    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .update({
        sent_to_supplier: true,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', voucherId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new VoucherService();
