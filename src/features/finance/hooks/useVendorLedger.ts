import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/hooks/useAuth';
import { vendorLedgerService } from '../services/vendorLedgerService';
import { VendorSummary, SupplierService, VendorPayment, RecordPaymentInput } from '../types/vendorLedger';
import { toast } from 'sonner';

export const useVendorLedger = () => {
  const { tenant } = useAuth();
  const [suppliers, setSuppliers] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSupplier, setSelectedSupplier] = useState<VendorSummary | null>(null);
  const [services, setServices] = useState<SupplierService[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<{ type: 'supplier' | 'service', id: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await vendorLedgerService.getVendorSummary(tenant.id);
      setSuppliers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      toast.error('Failed to sync vendor data');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectSupplier = async (supplier: VendorSummary | null) => {
    setSelectedSupplier(supplier);
    if (supplier && tenant?.id) {
      try {
        const [sData, pData] = await Promise.all([
          vendorLedgerService.getSupplierServices(supplier.id, tenant.id),
          vendorLedgerService.getSupplierPayments(supplier.id, tenant.id)
        ]);
        setServices(sData);
        setPayments(pData);
      } catch (e: any) {
        toast.error('Failed to load supplier details');
      }
    } else {
      setServices([]);
      setPayments([]);
    }
  };

  const recordPayment = async (data: Omit<RecordPaymentInput, 'recordedBy'>) => {
    if (!tenant?.id) return;
    try {
      await vendorLedgerService.recordVendorPayment({
        ...data,
        recordedBy: tenant.id // Using tenant_id as placeholder if user id not available or appropriate
      }, tenant.id);
      
      toast.success('Payment Recorded Successfully');
      await fetchData();
      if (selectedSupplier) {
        await selectSupplier(selectedSupplier);
      }
      setDrawerOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Payment recording failed');
    }
  };

  return {
    suppliers,
    loading,
    error,
    selectedSupplier,
    services,
    payments,
    drawerOpen,
    setDrawerOpen,
    drawerType,
    setDrawerType,
    selectSupplier,
    recordPayment,
    refreshAll: fetchData
  };
};
