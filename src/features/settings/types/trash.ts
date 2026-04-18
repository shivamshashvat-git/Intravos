export interface TrashRecord {
  table_name: string;
  item_id: string;
  deleted_at: string;
  deleted_by?: string;
  item_label: string;
  module_name: string;
  item_meta?: Record<string, any>;
}

export interface TrashGroup {
  label: string;
  count: number;
  records: TrashRecord[];
}

export const TABLE_LABELS: Record<string, string> = {
  leads: 'Leads',
  invoices: 'Invoices',
  quotations: 'Quotations',
  customers: 'Customers',
  suppliers: 'Suppliers',
  documents: 'Documents',
  vouchers: 'Vouchers',
  vendor_ledger: 'Vendor Ledger',
  cancellations: 'Cancellations',
  group_booking_members: 'Group Members',
  itinerary_items: 'Itinerary Items',
  itinerary_days: 'Itinerary Days',
  markup_presets: 'Markup Presets'
};
