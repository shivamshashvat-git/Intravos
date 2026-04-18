export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type BookingPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ServiceType = 'flight' | 'hotel' | 'transfer' | 'activity' | 'visa' | 'insurance' | 'misc';
export type ServiceStatus = 'pending' | 'confirmed' | 'cancelled';
export type VisaStatus = 'not_required' | 'required' | 'applied' | 'approved' | 'rejected';

export interface BookingService {
  id: string;
  tenant_id: string;
  booking_id: string;
  service_type: ServiceType;
  description: string;
  provider?: string;
  confirmation_number?: string;
  service_date?: string;
  service_end_date?: string;
  pax_count: number;
  selling_price: number;
  cost_price: number;
  status: ServiceStatus;
  notes?: string;
  sort_order: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  tenant_id: string;
  booking_id: string;
  traveler_id?: string;
  name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
  nationality: string;
  dietary_preferences?: string;
  special_needs?: string;
  frequent_flyer?: string;
  seat_preference?: string;
  meal_preference?: string;
  visa_status: VisaStatus;
  notes?: string;
  sort_order: number;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  booking_number: string;
  lead_id?: string;
  customer_id: string;
  invoice_id?: string;
  quotation_id?: string;
  title: string;
  destination?: string;
  travel_date_start: string;
  travel_date_end: string;
  return_date?: string;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  total_pax: number;
  status: BookingStatus;
  priority: BookingPriority;

  // Financials
  selling_price: number;
  cost_price: number;
  amount_paid: number;
  amount_outstanding: number;
  profit: number;
  margin_percentage: number;

  // Operational
  internal_notes?: string;
  special_requirements?: string;
  meal_preferences?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // PNR Tracker
  flight_pnr?: string;
  hotel_confirmation?: string;
  transfer_confirmation?: string;

  // Supplier
  supplier_name?: string;
  supplier_contact?: string;
  supplier_reference?: string;

  // Meta
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  // Joins
  customer?: { id: string; name: string; phone: string; email: string };
  invoice?: { id: string; invoice_number: string; status: string; total_amount: number; amount_outstanding: number };
  quotation?: { id: string; quote_number: string };
  services?: BookingService[];
  members?: GroupMember[];
}

export interface BookingFilters {
  status?: BookingStatus | 'all';
  priority?: BookingPriority | 'all';
  search?: string;
  travel_date_from?: string;
  travel_date_to?: string;
  upcoming?: boolean;
  departing_soon?: boolean;
  customer_id?: string;
}
