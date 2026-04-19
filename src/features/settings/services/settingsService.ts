import { apiClient } from '@/core/lib/apiClient';
import { TenantSettings, TeamMember, BankAccount } from '@/features/settings/types/settings';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const settingsService = {
  async getTenant(tenantId: string) {
    const res = await apiClient(`${API_BASE}/api/v1/settings`);
    if (!res.ok) throw new Error('Failed to fetch tenant configuration');
    const result = await res.json();
    return result.data as TenantSettings;
  },

  async updateTenant(tenantId: string, updates: Partial<TenantSettings>) {
    const res = await apiClient(`${API_BASE}/api/v1/settings`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update tenant configuration');
  },

  async uploadLogo(tenantId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'tenant-logos');

    const res = await apiClient(`${API_BASE}/api/v1/system/uploads`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload logo');
    const result = await res.json();
    
    const publicUrl = result.data?.signed_url;
    await this.updateTenant(tenantId, { logo_url: publicUrl });
    return publicUrl;
  },

  async getPlatformSettings() {
    const res = await apiClient(`${API_BASE}/api/v1/settings/platform`);
    if (!res.ok) throw new Error('Failed to fetch platform overrides');
    const result = await res.json();
    return result.data;
  },

  async updatePlatformSettings(data: any) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/platform`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update platform overrides');
  },

  async getTeamMembers(tenantId: string) {
    const res = await apiClient(`${API_BASE}/api/v1/team`);
    if (!res.ok) throw new Error('Failed to fetch team members');
    const result = await res.json();
    return result.data as TeamMember[];
  },

  async updateMember(id: string, updates: Partial<TeamMember>) {
    const res = await apiClient(`${API_BASE}/api/v1/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update team member');
  },

  async inviteMember(tenantId: string, data: any) {
    const res = await apiClient(`${API_BASE}/api/v1/team/invite`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to invite member');
  },

  async deleteMember(id: string) {
    const res = await apiClient(`${API_BASE}/api/v1/team/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to deactivate member');
  },

  async getBankAccounts(tenantId: string) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/bank-accounts`);
    if (!res.ok) throw new Error('Failed to fetch bank accounts');
    const result = await res.json();
    return result.data as BankAccount[];
  },

  async createBankAccount(tenantId: string, data: Partial<BankAccount>) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create bank account');
  },

  async updateBankAccount(id: string, updates: Partial<BankAccount>, tenantId: string) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/bank-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update bank account');
  },

  async setPrimaryBankAccount(id: string, tenantId: string) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/bank-accounts/${id}/primary`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to set primary bank account');
  },

  async deleteBankAccount(id: string) {
    const res = await apiClient(`${API_BASE}/api/v1/settings/bank-accounts/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete bank account');
  }
};
