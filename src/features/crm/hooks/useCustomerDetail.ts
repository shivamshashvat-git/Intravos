import { useState, useEffect, useCallback } from 'react';
import { Customer, AssociatedTraveler } from '@/features/crm/types/customer';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';

export function useCustomerDetail(customerId: string) {
  const { tenant } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [travelers, setTravelers] = useState<AssociatedTraveler[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!customerId || !tenant?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { customer: custData, travelers: travData } = await customersService.getCustomerById(customerId);
      setCustomer(custData);
      setTravelers(travData);

      const [leadsData, quotesData, invoicesData] = await Promise.all([
        customersService.getCustomerLeads(customerId, tenant.id, custData.phone || undefined),
        customersService.getCustomerQuotations(customerId, tenant.id),
        customersService.getCustomerInvoices(customerId, tenant.id)
      ]);

      setLeads(leadsData);
      setQuotations(quotesData);
      setInvoices(invoicesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, tenant?.id]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  return {
    customer,
    travelers,
    leads,
    quotations,
    invoices,
    isLoading,
    error,
    refreshCustomer: fetchCustomerData,
    setCustomer
  };
}
