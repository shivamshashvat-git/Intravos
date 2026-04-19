import { QuotationStatus, ItemCategory, DiscountType } from './quotation';

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'neft' | 'rtgs' | 'cheque' | 'card' | 'bank_transfer' | 'other';

export interface InvoiceItem {
  id: string;
  tenant_id: string;
  invoice_id: string;
  sort_order: number;
  category: ItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  selling_price: number;
  cost_price: number;
  gst_rate: number;
  gst_amount: number;
  hsn_sac_code?: string;
  is_optional: boolean;
  notes?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  reference_number?: string;
  bank_account_id?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  quotation_id?: string;
  lead_id?: string;
  customer_id: string;
  title: string;
  destination?: string;
  travel_date_start?: string;
  travel_date_end?: string;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  status: InvoiceStatus;
  invoice_date: string;
  due_date?: string;
  payment_terms?: string;

  // Financial
  subtotal: number;
  discount_amount: number;
  discount_type: DiscountType;
  discount_value: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  selling_price: number;
  cost_price: number;
  total_vendor_cost: number;
  total_margin: number;
  margin_percentage: number;

  // Collection
  amount_paid: number;
  amount_outstanding: number;

  // GST Compliance
  gstin_supplier?: string;
  gstin_customer?: string;
  place_of_supply?: string;
  is_igst: boolean;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;

  // Meta
  notes?: string;
  terms?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sent_at?: string;
  paid_at?: string;
  payment_link_url?: string;

  // Joins
  customer?: { id: string; name: string; phone: string; email: string };
  quotation?: { id: string; quote_number: string };
  items?: InvoiceItem[];
  payments?: PaymentTransaction[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus | 'all';
  search?: string;
  customer_id?: string;
  overdue?: boolean;
}

export interface InvoiceSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueValue: number;
  thisMonthValue: number;
}
