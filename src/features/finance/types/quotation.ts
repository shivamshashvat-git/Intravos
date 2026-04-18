export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised' | 'expired';
export type ItemCategory = 'flight' | 'hotel' | 'transfer' | 'activity' | 'visa' | 'insurance' | 'misc';
export type DiscountType = 'none' | 'flat' | 'percentage';

export interface QuotationItem {
  id: string;
  tenant_id: string;
  quotation_id: string;
  sort_order: number;
  category: ItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  selling_price: number;
  cost_price: number;
  is_optional: boolean;
  is_included: boolean;
  notes?: string;
  vendor_name?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  tenant_id: string;
  quote_number: string;
  lead_id?: string;
  customer_id?: string;
  title: string;
  destination?: string;
  travel_date_start?: string;
  travel_date_end?: string;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  status: QuotationStatus;
  valid_until?: string;
  notes?: string;
  terms?: string;
  version: number;
  parent_quote_id?: string;
  
  // Financial
  subtotal: number;
  discount_amount: number;
  discount_type: DiscountType;
  discount_value: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  selling_price: number; // calculated as total_amount
  cost_price: number;    // internal sum of items cost
  total_vendor_cost: number;
  total_margin: number;
  margin_percentage: number;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sent_at?: string;
  accepted_at?: string;

  // Join data
  customer?: { id: string; name: string; phone: string; email: string };
  lead?: { id: string; destination: string };
  items?: QuotationItem[];
}

export interface QuotationFilters {
  status?: QuotationStatus | 'all';
  search?: string;
  customer_id?: string;
  lead_id?: string;
}

export interface QuotationSummary {
  totalCount: number;
  pendingCount: number;
  acceptedCount: number;
  acceptedValue: number;
  conversionRate: number;
}
