import { supabase } from '@/core/lib/supabase';
import { TenantSettings, TeamMember, BankAccount } from '@/features/settings/types/settings';

export const settingsService = {
  async getTenant(tenantId: string) {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    if (error) throw error;
    return data as TenantSettings;
  },

  async updateTenant(tenantId: string, updates: Partial<TenantSettings>) {
    const { error } = await supabase.from('tenants').update(updates).eq('id', tenantId);
    if (error) throw error;
  },

  async uploadLogo(tenantId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `${tenantId}/logo_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-logos')
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('tenant-logos').getPublicUrl(path);
    await this.updateTenant(tenantId, { logo_url: publicUrl });
    return publicUrl;
  },

  async getTeamMembers(tenantId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('role', { ascending: true });
    if (error) throw error;
    return data as TeamMember[];
  },

  async updateMember(id: string, updates: Partial<TeamMember>) {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw error;
  },

  async inviteMember(tenantId: string, data: any) {
    // Ideally use Admin API, but for many setups we just insert user record
    const { error } = await supabase.from('users').insert({
      tenant_id: tenantId,
      email: data.email,
      name: data.name,
      role: data.role,
      designation: data.designation,
      is_active: true
    });
    if (error) throw error;
  },

  async getBankAccounts(tenantId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return data as BankAccount[];
  },

  async createBankAccount(tenantId: string, data: Partial<BankAccount>) {
    if (data.is_primary) {
      await supabase.from('bank_accounts').update({ is_primary: false }).eq('tenant_id', tenantId);
    }
    const { error } = await supabase.from('bank_accounts').insert({ ...data, tenant_id: tenantId });
    if (error) throw error;
  },

  async updateBankAccount(id: string, updates: Partial<BankAccount>, tenantId: string) {
    if (updates.is_primary) {
      await supabase.from('bank_accounts').update({ is_primary: false }).eq('tenant_id', tenantId);
    }
    const { error } = await supabase.from('bank_accounts').update(updates).eq('id', id);
    if (error) throw error;
  },

  async setPrimaryBankAccount(id: string, tenantId: string) {
    await supabase.from('bank_accounts').update({ is_primary: false }).eq('tenant_id', tenantId);
    const { error } = await supabase.from('bank_accounts').update({ is_primary: true }).eq('id', id);
    if (error) throw error;
  },

  async deleteBankAccount(id: string) {
    const { error } = await supabase.from('bank_accounts').update({ deleted_at: new Date().toISOString(), is_primary: false }).eq('id', id);
    if (error) throw error;
  }
};
