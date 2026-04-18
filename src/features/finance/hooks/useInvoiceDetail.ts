import { useState, useEffect, useCallback } from 'react';
import { Invoice, PaymentTransaction, InvoiceStatus } from '../types/invoice';
import { invoicesService } from '../services/invoicesService';
import { useAuth } from '@/core/hooks/useAuth';

export function useInvoiceDetail(id: string) {
  const { tenant, user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await invoicesService.getInvoiceById(id);
      setInvoice(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const recordPayment = async (data: Partial<PaymentTransaction>) => {
    if (!tenant?.id || !user?.id) return;
    try {
      await invoicesService.recordPayment({
        ...data,
        invoice_id: id,
        tenant_id: tenant.id,
        recorded_by: user.id
      });
      await fetchData();
    } catch (e: any) {
       console.error(e);
       throw e;
    }
  };

  const deletePayment = async (paymentId: string) => {
    try {
      await invoicesService.deletePayment(paymentId, id);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (status: InvoiceStatus) => {
    try {
      await invoicesService.updateInvoiceStatus(id, status);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    invoice,
    isLoading,
    error,
    refresh: fetchData,
    recordPayment,
    deletePayment,
    updateStatus
  };
}
