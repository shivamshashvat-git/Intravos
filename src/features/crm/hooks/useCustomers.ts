import { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerFilters } from '@/features/crm/types/customer';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';

export function useCustomers(initialFilters: CustomerFilters = {}) {
  const { tenant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const [stats, setStats] = useState({
    total: 0,
    corporate: 0,
    activeThisMonth: 0
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, total } = await customersService.getCustomers(filters, page);
      setCustomers(data);
      setTotalCount(total);

      // Fetch Stats — Industrialized backend should ideally provide a /stats endpoint, 
      // but for now we keep the parallel fetching logic using the new service interface.
      const [allRes, corporateRes] = await Promise.all([
        customersService.getCustomers({}),
        customersService.getCustomers({ customer_type: 'corporate' })
      ]);
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      setStats({
        total: allRes.total,
        corporate: corporateRes.total,
        activeThisMonth: allRes.data.filter(c => 
          (c.last_booking_at && (c.last_booking_at as any) > thirtyDaysAgo) || 
          (c.last_contacted_at && (c.last_contacted_at as any) > thirtyDaysAgo)
        ).length
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomerOptimistically = (customer: Customer) => {
    setCustomers(prev => [customer, ...prev]);
    setTotalCount(prev => prev + 1);
  };

  return {
    customers,
    totalCount,
    isLoading,
    page,
    setPage,
    filters,
    setFilters,
    stats,
    refreshCustomers: fetchCustomers,
    addCustomerOptimistically
  };
}
