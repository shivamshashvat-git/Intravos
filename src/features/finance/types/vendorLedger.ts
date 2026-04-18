export type SupplierType = 'hotel' | 'flight' | 'activity' | 'transfer' | 'other';
export type SupplierPaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque' | 'other';

export interface VendorSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  contact_person: string | null;
  supplier_type: SupplierType;
  total_cost: number;
  total_paid: number;
  outstanding: number;
  service_count: number;
  last_payment_date: string | null;
  payment_terms?: string | null;
}

export interface SupplierService {
  id: string;
  booking_id: string;
  booking_ref: string;
  title: string;
  service_type: string;
  service_start_date: string;
  service_end_date: string;
  cost_price: number;
  selling_price: number;
  paid_to_supplier: number;
  supplier_payment_status: SupplierPaymentStatus;
}

export interface VendorPayment {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  booking_service_id: string | null;
}

export interface RecordPaymentInput {
  supplierId: string;
  bookingServiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
}
