import { supabase } from '@/core/supabase/client';
import { VendorSummary, SupplierService, VendorPayment, RecordPaymentInput } from '../types/vendorLedger';

export const vendorLedgerService = {
  async getVendorSummary(tenantId: string): Promise<VendorSummary[]> {
    // 1. Get all active suppliers
    const { data: suppliers, error: sError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (sError) throw sError;

    // 2. Get costs from booking_services
    const { data: costs, error: cError } = await supabase
      .from('booking_services')
      .select('supplier_id, cost_price')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (cError) throw cError;

    // 3. Get payments from payment_transactions (direction='out')
    const { data: payments, error: pError } = await supabase
      .from('payment_transactions')
      .select('vendor_id, amount, payment_date')
      .eq('tenant_id', tenantId)
      .eq('direction', 'out')
      .is('deleted_at', null);

    if (pError) throw pError;

    return (suppliers || []).map(s => {
      const supplierCosts = (costs || []).filter(c => c.supplier_id === s.id);
      const supplierPayments = (payments || []).filter(p => p.vendor_id === s.id);

      const total_cost = supplierCosts.reduce((sum, c) => sum + (Number(c.cost_price) || 0), 0);
      const total_paid = supplierPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const lastPayment = [...supplierPayments].sort((a,b) => b.payment_date.localeCompare(a.payment_date))[0];

      return {
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country,
        contact_person: s.contact_person,
        supplier_type: s.supplier_type as any,
        total_cost,
        total_paid,
        outstanding: total_cost - total_paid,
        service_count: supplierCosts.length,
        last_payment_date: lastPayment?.payment_date || null,
        payment_terms: s.payment_terms
      };
    }).sort((a, b) => b.outstanding - a.outstanding);
  },

  async getSupplierServices(supplierId: string, tenantId: string): Promise<SupplierService[]> {
    const { data, error } = await supabase
      .from('booking_services')
      .select(`
        *,
        bookings!inner (
          booking_number,
          travel_date_start
        )
      `)
      .eq('supplier_id', supplierId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('service_start_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      booking_ref: item.bookings?.booking_number || 'N/A'
    }));
  },

  async getSupplierPayments(supplierId: string, tenantId: string): Promise<VendorPayment[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('vendor_id', supplierId)
      .eq('direction', 'out')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async recordVendorPayment(data: RecordPaymentInput, tenantId: string) {
    const { data: txn, error: tError } = await supabase
      .from('payment_transactions')
      .insert({
        tenant_id: tenantId,
        vendor_id: data.supplierId,
        booking_service_id: data.bookingServiceId,
        amount: data.amount,
        direction: 'out',
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate,
        reference_number: data.referenceNumber,
        notes: data.notes,
        recorded_by: data.recordedBy
      })
      .select()
      .single();

    if (tError) throw tError;

    if (data.bookingServiceId) {
      const { data: service, error: sError } = await supabase
        .from('booking_services')
        .select('*')
        .eq('id', data.bookingServiceId)
        .single();
      
      if (sError) throw sError;

      const newPaid = (Number(service.paid_to_supplier) || 0) + data.amount;
      const cost = Number(service.cost_price) || 0;
      let status = 'unpaid';
      if (newPaid >= cost) status = 'paid';
      else if (newPaid > 0) status = 'partial';

      const { error: uError } = await supabase
        .from('booking_services')
        .update({
          paid_to_supplier: newPaid,
          supplier_payment_status: status
        })
        .eq('id', data.bookingServiceId);
      
      if (uError) throw uError;
    }

    return txn;
  }
};
