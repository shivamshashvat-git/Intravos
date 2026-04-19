
import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

class VoucherService {
  async listVouchers(tenantId, filters = {}) {
    const { booking_id, status } = filters;
    let query = supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (booking_id) query = query.eq('booking_id', booking_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createVoucher(tenantId, userId, payload) {
    const { 
      voucher_number, 
      service_id, 
      confirmation_number,
      valid_from,
      valid_to,
      ...rest 
    } = payload;
    
    // Industrial ID Resolution
    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualUserId = userRec?.id || userId;

    // Industrial Mapping for DB consistency (vouchers table)
    const dbPayload = {
      tenant_id: tenantId,
      created_by: actualUserId,
      booking_id: payload.booking_id,
      booking_service_id: service_id || payload.booking_service_id,
      voucher_num: voucher_number || payload.voucher_num,
      booking_reference: confirmation_number || payload.booking_reference,
      travel_dates: (valid_from && valid_to) ? `${valid_from} - ${valid_to}` : payload.travel_dates,
      guest_names: payload.guest_names,
      room_type: payload.room_type,
      meal_plan: payload.meal_plan,
      special_requests: payload.special_requests
    };

    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVoucher(tenantId, id, updates) {
    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVoucher(tenantId, id) {
    return await softDeleteDirect(supabaseAdmin, 'vouchers', id, tenantId);
  }

  async generatePdf(tenantId, id) {
    const { data: voucher, error } = await supabaseAdmin
      .from('vouchers')
      .select('*, bookings(*, customers(*))')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !voucher) throw new Error('Voucher not found');

    const branding = await fetchTenantBranding(supabaseAdmin, tenantId);
    return generatePdf('voucher', voucher, branding);
  }
}

export default new VoucherService();
