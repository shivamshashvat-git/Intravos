export type ItineraryItemType = 
  'flight' | 'hotel' | 'transfer' | 'activity' | 'meal' | 
  'sightseeing' | 'visa' | 'other' | 'note' | 'internal_note' | 
  'insurance' | 'lounge' | 'sim_card' | 'forex';

export type ItineraryStatus = 'draft' | 'ready' | 'shared';

export interface ItineraryItem {
  id: string;
  day_id: string;
  itinerary_id: string;
  item_type: ItineraryItemType;
  title: string;
  description: string | null;
  location: string | null;
  duration: string | null;
  time_val: string | null;
  sort_order: number;
  media_urls: string[];
  notes?: string;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  date?: string;
  sort_order: number;
  items: ItineraryItem[];
  notes?: string;
  created_at: string;
}

export interface Itinerary {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  lead_id: string | null;
  customer_id: string | null;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  total_days: number;
  status: ItineraryStatus;
  is_public: boolean;
  public_slug: string | null;
  share_token?: string; // Legacy
  is_shared?: boolean;  // Legacy
  is_template: boolean;
  template_name: string | null;
  cover_image_url: string | null;
  metadata: {
    [key: string]: any;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItineraryWithDetails extends Itinerary {
  days: ItineraryDay[];
}

export interface ItineraryFilters {
  lead_id?: string;
  customer_id?: string;
  booking_id?: string;
  status?: ItineraryStatus | 'all';
  search?: string;
}
