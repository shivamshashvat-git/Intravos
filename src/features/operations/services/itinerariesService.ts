
import { apiClient } from '@/core/lib/apiClient';
import { Itinerary, ItineraryDay, ItineraryItem, ItineraryFilters, ItineraryWithDetails } from '@/features/operations/types/itinerary';

export const itinerariesService = {
  /**
   * List itineraries with filters
   */
  async getItineraries(tenantId: string, filters?: ItineraryFilters) {
    const params = new URLSearchParams();
    if (filters?.lead_id) params.append('lead_id', filters.lead_id);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.booking_id) params.append('booking_id', filters.booking_id);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const res = await apiClient(`/api/operations/itineraries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch itineraries');
    const result = await res.json();
    return result.data?.itineraries || result.data as Itinerary[];
  },

  /**
   * Fetch itinerary by booking ID
   */
  async getItineraryByBooking(bookingId: string) {
    const res = await apiClient(`/api/operations/itineraries/booking/${bookingId}`);
    if (!res.ok) return null;
    const result = await res.json();
    return result.data?.itinerary;
  },

  /**
   * Create itinerary for a booking
   */
  async createBookingItinerary(bookingId: string, data: any) {
    const res = await apiClient(`/api/operations/itineraries/booking/${bookingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create itinerary');
    const result = await res.json();
    return result.data?.itinerary;
  },

  /**
   * Update itinerary core details
   */
  async updateItinerary(id: string, data: Partial<Itinerary>) {
    const res = await apiClient(`/api/operations/itineraries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update itinerary');
    const result = await res.json();
    return result.data?.itinerary;
  },

  // Day Ops
  async addDay(itineraryId: string, data: any) {
    const res = await apiClient(`/api/operations/itineraries/${itineraryId}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add day');
    const result = await res.json();
    return result.data?.day;
  },

  async updateDay(dayId: string, data: any) {
    const res = await apiClient(`/api/operations/itineraries/days/${dayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update day');
    const result = await res.json();
    return result.data?.day;
  },

  async deleteDay(dayId: string) {
    const res = await apiClient(`/api/operations/itineraries/days/${dayId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete day');
  },

  // Item Ops
  async addItem(dayId: string, data: any) {
    const res = await apiClient(`/api/operations/itineraries/days/${dayId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add item');
    const result = await res.json();
    return result.data?.item;
  },

  async updateItem(itemId: string, data: any) {
    const res = await apiClient(`/api/operations/itineraries/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update item');
    const result = await res.json();
    return result.data?.item;
  },

  async deleteItem(itemId: string) {
    const res = await apiClient(`/api/operations/itineraries/items/${itemId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete item');
  },

  async reorderItems(dayId: string, itemIds: string[]) {
    const res = await apiClient(`/api/operations/itineraries/days/${dayId}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_ids: itemIds })
    });
    if (!res.ok) throw new Error('Failed to reorder items');
  },

  // PDF Generation
  async generatePdf(itineraryId: string) {
    const res = await apiClient(`/api/operations/itineraries/${itineraryId}/pdf`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    return await res.blob();
  }
};
