import { supabaseAdmin } from '../../../providers/database/supabase.js';
import BaseService from '../../../core/utils/BaseService.js';

class TenantsService extends BaseService {
  /**
   * Get Core Agency Profile
   */
  async getTenantProfile(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update Agency Branding/Metadata
   */
  async updateTenantProfile(tenantId, patch, actorId) {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update(patch)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'tenant_profile_updated', 'tenants', tenantId, patch);
    return data;
  }

  /**
   * Upsert-On-Read for Platform Settings
   */
  async getPlatformSettings(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Default creation if missing
      const { data: created, error: createErr } = await supabaseAdmin
        .from('platform_settings')
        .insert({ tenant_id: tenantId })
        .select()
        .single();
      
      if (createErr) throw createErr;
      return created;
    }

    return data;
  }

  /**
   * Update Platform Overrides
   */
  async updatePlatformSettings(tenantId, patch, actorId) {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ tenant_id: tenantId, ...patch })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'platform_settings_updated', 'platform_settings', data.id, patch);
    return data;
  }

  /**
   * Bank Account Management
   */
  async listBankAccounts(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async addBankAccount(tenantId, data, actorId) {
    const { data: account, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert({ tenant_id: tenantId, ...data })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'bank_account_added', 'bank_accounts', account.id);
    return account;
  }

  async updateBankAccount(tenantId, id, patch, actorId) {
    const { data: account, error } = await supabaseAdmin
      .from('bank_accounts')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'bank_account_updated', 'bank_accounts', id, patch);
    return account;
  }

  async deleteBankAccount(tenantId, id, actorId) {
    const { error } = await supabaseAdmin
      .from('bank_accounts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: actorId
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'bank_account_deleted', 'bank_accounts', id);
    return true;
  }

  async setPrimaryBankAccount(tenantId, accountId, actorId) {
    // We store the primary account ID in the tenant's bank_details JSONB field
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('bank_details')
      .eq('id', tenantId)
      .single();

    const bankDetails = { ...(tenant?.bank_details || {}), primary_account_id: accountId };

    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ bank_details: bankDetails })
      .eq('id', tenantId);

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'bank_primary_set', 'tenants', tenantId, { primary_account_id: accountId });
    return true;
  }
}

export default new TenantsService();
