export type CustomerType = 'individual' | 'corporate';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  alt_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  
  // Personal
  date_of_birth: string | null;
  wedding_anniversary: string | null;
  gender: 'male' | 'female' | 'other' | null;
  
  // Preferences
  preferred_destinations: string | null;
  preferred_airlines: string | null;
  preferred_hotel_class: 'budget' | '3_star' | '4_star' | '5_star' | 'luxury' | null;
  dietary_preferences: string | null;
  special_needs: string | null;
  
  // Identity
  passport_number: string | null;
  passport_expiry: string | null;
  pan_number: string | null;
  gst_number: string | null;
  aadhar_number: string | null;
  
  // Metrics
  lifetime_value: number;
  total_bookings: number;
  total_spent: number;
  last_booking_at: string | null;
  last_contacted_at: string | null;
  bookings_count: number;
  
  // Segmentation
  customer_type: CustomerType;
  tags: string[];
  lead_source: string | null;
  referred_by: string | null;
  
  // Flexible storage
  important_dates: { label: string; date: string; type: 'birthday' | 'anniversary' | 'other' }[];
  preferences: Record<string, any>;
  notes: string | null;
  
  // System
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AssociatedTraveler {
  id: string;
  tenant_id: string;
  customer_id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_country: string | null;
  nationality: string;
  dietary_preferences: string | null;
  special_needs: string | null;
  frequent_flyer: string | null;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CustomerFilters {
  customer_type?: CustomerType | 'all';
  search?: string;
  tags?: string[];
  lead_source?: string;
}
