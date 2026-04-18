import { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceFilters, InvoiceStatus } from '../types/invoice';
import { invoicesService } from '../services/invoicesService';
import { useAuth } from '@/core/hooks/useAuth';

export function useInvoices(initialFilters?: InvoiceFilters) {
  const { tenant } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'all',
    search: '',
    ...initialFilters
  });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await invoicesService.getInvoices(tenant.id, filters);
      setInvoices(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = {
    totalInvoiced: invoices.filter(i => i.status !== 'cancelled').reduce((sum, i) => sum + i.total_amount, 0),
    totalCollected: invoices.reduce((sum, i) => sum + i.amount_paid, 0),
    totalOutstanding: invoices.filter(i => i.status !== 'cancelled').reduce((sum, i) => sum + i.amount_outstanding, 0),
    overdueCount: invoices.filter(i => i.status === 'overdue').length,
    overdueValue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount_outstanding, 0),
    thisMonthValue: invoices.filter(i => {
      const date = new Date(i.invoice_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, i) => sum + i.total_amount, 0)
  };

  return {
    invoices,
    isLoading,
    error,
    filters,
    setFilters,
    summary,
    refresh: fetchData,
    toggleOverdue: () => setFilters(prev => ({ ...prev, overdue: !prev.overdue }))
  };
}
