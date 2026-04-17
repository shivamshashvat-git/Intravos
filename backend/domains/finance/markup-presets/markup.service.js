import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * MarkupService — Pricing Governance & Global Presets
 */
class MarkupService {
  /**
   * List specialized presets
   */
  async listPresets(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('markup_presets')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Register new internal pricing logic
   */
  async createPreset(tenantId, payload) {
    const { name, calc_type, calc_value } = payload;
    if (!name || !calc_type || calc_value === undefined) {
      throw new Error('name, calc_type, and calc_value are required');
    }

    const { data, error } = await supabaseAdmin
      .from('markup_presets')
      .insert({
        ...payload,
        tenant_id: tenantId,
        is_active: payload.is_active !== undefined ? payload.is_active : true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Modify pricing rule attributes
   */
  async updatePreset(tenantId, presetId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('markup_presets')
      .update(updates)
      .eq('id', presetId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retire pricing logic
   */
  async deletePreset(tenantId, userId, presetId) {
    return await softDeleteDirect({
      table: 'markup_presets',
      id: presetId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Markup preset'
    });
  }
}

export default new MarkupService();
