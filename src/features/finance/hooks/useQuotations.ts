import { useState, useEffect, useCallback } from 'react';
import { Quotation, QuotationFilters, QuotationStatus } from '../types/quotation';
import { quotationsService } from '../services/quotationsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useQuotations(initialFilters?: QuotationFilters) {
  const { tenant } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<QuotationFilters>({
    status: 'all',
    search: '',
    ...initialFilters
  });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await quotationsService.getQuotations(tenant.id, filters);
      setQuotations(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search changes
    return () => clearTimeout(timer);
  }, [fetchData]);

  const updateStatus = async (id: string, status: QuotationStatus) => {
    try {
      await quotationsService.updateQuotationStatus(id, status);
      await fetchData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      await quotationsService.deleteQuotation(id);
      await fetchData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const summary = {
    totalCount: quotations.length,
    pendingCount: quotations.filter(q => q.status === 'draft' || q.status === 'sent').length,
    acceptedCount: quotations.filter(q => q.status === 'accepted').length,
    acceptedValue: quotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total_amount, 0),
    conversionRate: quotations.length > 0 ? (quotations.filter(q => q.status === 'accepted').length / quotations.length) * 100 : 0
  };

  return {
    quotations,
    isLoading,
    error,
    filters,
    setFilters,
    summary,
    refresh: fetchData,
    updateStatus,
    deleteQuotation
  };
}
