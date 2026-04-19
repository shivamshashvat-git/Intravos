import { apiClient } from '@/core/lib/apiClient';
import { VendorSummary, SupplierService, VendorPayment, RecordPaymentInput } from '../types/vendorLedger';

export const vendorLedgerService = {
  async getVendorSummary(tenantId: string): Promise<VendorSummary[]> {
    const res = await apiClient(`/api/finance/vendor-ledger/dashboard`);
    if (!res.ok) {
       const fallbackRes = await apiClient(`/api/finance/vendor-ledger`);
       if (!fallbackRes.ok) throw new Error('Failed to fetch ledger summary');
       const fallbackResult = await fallbackRes.json();
       return fallbackResult.data?.ledger || fallbackResult.data?.summary || [];
    }
    const result = await res.json();
    return result.data?.summary || result.data as VendorSummary[];
  },

  async getSupplierServices(supplierId: string, tenantId: string): Promise<SupplierService[]> {
    const res = await apiClient(`/api/finance/vendor-ledger/supplier/${supplierId}/services`);
    if (!res.ok) {
        // another potential guess
        const altRes = await apiClient(`/api/operations/bookings?supplier_id=${supplierId}`);
        if (!altRes.ok) throw new Error('Failed to fetch supplier services');
        const altResult = await altRes.json();
        return altResult.data?.services || [];
    }
    const result = await res.json();
    return result.data?.services as SupplierService[];
  },

  async getSupplierPayments(supplierId: string, tenantId: string): Promise<VendorPayment[]> {
    const res = await apiClient(`/api/finance/payments?vendor_id=${supplierId}`);
    if (!res.ok) throw new Error('Failed to fetch supplier payments');
    const result = await res.json();
    return result.data?.payments || result.data as VendorPayment[];
  },

  async recordVendorPayment(data: RecordPaymentInput, tenantId: string) {
    const res = await apiClient(`/api/finance/payments/supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record supplier payment');
    const result = await res.json();
    return result.data?.payment;
  }
};
