export type LeadSource = 
  | 'whatsapp' 
  | 'manual' 
  | 'website' 
  | 'referral' 
  | 'agent' 
  | 'network' 
  | 'campaign' 
  | 'instagram';

export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'quote_sent' 
  | 'negotiating' 
  | 'converted' 
  | 'lost' 
  | 'on_hold';

export type LeadPriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'urgent';

export interface Lead {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  assigned_to: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  destination: string | null;
  hotel_name: string | null;
  location: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  travel_start_date: string | null;
  guests: number;
  rooms: number;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  price_seen: number | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  budget: number;
  selling_price: number;
  cost_price: number;
  profit: number;
  margin: number;
  amount_collected: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  internal_notes?: string;
}

export interface LeadNote {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  deleted_at: string | null;
}

export type CommType = 'call' | 'whatsapp' | 'email' | 'sms' | 'in_person';
export type CommDirection = 'inbound' | 'outbound';

export interface LeadCommunication {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string | null;
  comm_type: CommType;
  direction: CommDirection;
  summary: string | null;
  duration_mins: number | null;
  comm_date: string;
  created_at: string;
}

export interface LeadFollowup {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string | null;
  due_date: string;
  note: string | null;
  is_done: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface TimelineEntry {
  id: string;
  type: 'note' | 'communication' | 'followup' | 'status_change';
  date: string;
  content: string;
  is_pinned?: boolean;
  metadata: any;
  user_id: string | null;
}

export interface LeadFilters {
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
  priority?: LeadPriority | 'all';
  assigned_to?: string | 'all';
  search?: string;
  date_range?: {
    from: string;
    to: string;
  };
}
