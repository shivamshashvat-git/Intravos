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
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const { data, count } = await customersService.getCustomers(tenant.id, filters, page);
      setCustomers(data);
      setTotalCount(count);

      // Fetch Stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const [allRes, corporateRes] = await Promise.all([
        customersService.getCustomers(tenant.id, {}),
        customersService.getCustomers(tenant.id, { customer_type: 'corporate' })
      ]);

      // Note: Active This Month would ideally be a dedicated SQL count, 
      // but for now we calculate from total results if small or just a placeholder logic.
      // We will perform a specific query for activity if needed.
      
      setStats({
        total: allRes.count,
        corporate: corporateRes.count,
        activeThisMonth: allRes.data.filter(c => 
          (c.last_booking_at && c.last_booking_at > thirtyDaysAgo) || 
          (c.last_contacted_at && c.last_contacted_at > thirtyDaysAgo)
        ).length
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters, page]);

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
