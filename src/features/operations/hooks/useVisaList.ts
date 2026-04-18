import { useState, useEffect, useCallback } from 'react';
import { VisaTracking, VisaFilters, VisaStatus } from '../types/visa';
import { visaService } from '../services/visaService';
import { useAuth } from '@/core/hooks/useAuth';

export function useVisaList(initialFilters?: VisaFilters) {
  const { tenant } = useAuth();
  const [visas, setVisas] = useState<VisaTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VisaFilters>(initialFilters || {});

  const fetchVisas = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await visaService.getVisaList(tenant.id, filters);
      setVisas(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters]);

  useEffect(() => {
    fetchVisas();
  }, [fetchVisas]);

  const createVisa = async (data: Partial<VisaTracking>) => {
    if (!tenant?.id) return;
    try {
      const created = await visaService.createVisa({ ...data, tenant_id: tenant.id });
      await fetchVisas();
      return created;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const updateStatus = async (id: string, status: VisaStatus, extraFields?: any) => {
    try {
      await visaService.updateVisaStatus(id, status, extraFields);
      await fetchVisas();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const deleteVisa = async (id: string) => {
    if (!window.confirm('Terminate this visa tracking record?')) return;
    try {
      await visaService.deleteVisa(id);
      await fetchVisas();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return {
    visas,
    isLoading,
    error,
    filters,
    setFilters,
    createVisa,
    updateStatus,
    deleteVisa,
    refreshVisas: fetchVisas
  };
}
