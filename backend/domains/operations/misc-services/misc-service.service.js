
import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

class MiscServiceService {
  async listServices(tenantId, filters = {}) {
    const { booking_id } = filters;
    let query = supabaseAdmin
      .from('miscellaneous_services')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (booking_id) query = query.eq('booking_id', booking_id);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createService(tenantId, userId, payload) {
    const { data, error } = await supabaseAdmin
      .from('miscellaneous_services')
      .insert({ ...payload, tenant_id: tenantId, created_by: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateService(tenantId, id, updates) {
    const { data, error } = await supabaseAdmin
      .from('miscellaneous_services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteService(tenantId, id) {
    return await softDeleteDirect(supabaseAdmin, 'miscellaneous_services', id, tenantId);
  }
}

export default new MiscServiceService();
