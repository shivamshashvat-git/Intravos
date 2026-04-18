import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/features/settings/services/settingsService';
import { TenantSettings, TeamMember, BankAccount } from '@/features/settings/types/settings';
import { useAuth } from '@/core/hooks/useAuth';

export function useSettings() {
  const { tenant: authTenant } = useAuth();
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authTenant?.id) return;
    setIsLoading(true);
    try {
      const [tData, mData, bData] = await Promise.all([
        settingsService.getTenant(authTenant.id),
        settingsService.getTeamMembers(authTenant.id),
        settingsService.getBankAccounts(authTenant.id)
      ]);
      setTenant(tData);
      setMembers(mData || []);
      setBankAccounts(bData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [authTenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProfile = async (updates: Partial<TenantSettings>) => {
    if (!tenant) return;
    setIsSaving(true);
    try {
      await settingsService.updateTenant(tenant.id, updates);
      setTenant(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!tenant) return;
    setIsSaving(true);
    try {
      const url = await settingsService.uploadLogo(tenant.id, file);
      setTenant(prev => prev ? { ...prev, logo_url: url } : null);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    tenant,
    members,
    bankAccounts,
    isLoading,
    isSaving,
    updateProfile,
    uploadLogo,
    refresh: fetchData
  };
}
