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
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { customer: custData, travelers: travData } = await customersService.getCustomerById(customerId);
      setCustomer(custData);
      setTravelers(travData);

      const [quotesData, invoicesData, bookingsData] = await Promise.all([
        customersService.getCustomerQuotations(customerId),
        customersService.getCustomerInvoices(customerId),
        customersService.getCustomerBookings(customerId)
      ]);

      setQuotations(quotesData);
      setInvoices(invoicesData);
      setLeads([]); // Note: Leadhistory handled via relations if needed
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

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
