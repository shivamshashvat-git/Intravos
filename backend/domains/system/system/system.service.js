import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * SystemService — Core Infrastructure & Platform Configuration Orchestrator
 */
class SystemService {
  /**
   * Fetch core tenant configuration and entitlement state
   */
  async getTenantSettings(tenantId) {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, subscription_status, plan, subscription_end_date, features_enabled')
      .eq('id', tenantId)
      .single();

    if (error) throw error;
    return tenant;
  }

  /**
   * Modify platform entitlements for a target agency (Super Admin ONLY)
   */
  async updateTenantFeatures(actorRole, targetTenantId, features) {
    if (actorRole !== 'super_admin') throw new Error('Super Admin access required for infrastructure changes');
    if (!targetTenantId) throw new Error('target_tenant_id is required');

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .update({ features_enabled: features })
      .eq('id', targetTenantId)
      .select('id, name, features_enabled')
      .single();

    if (error) throw error;
    return tenant;
  }
}

export default new SystemService();
