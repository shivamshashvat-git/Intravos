import { supabase } from '@/core/lib/supabase';
import { apiClient } from '@/core/lib/apiClient';
import { Itinerary, ItineraryDay, ItineraryItem, ItineraryFilters, ItineraryWithDetails } from '@/features/operations/types/itinerary';

export const itinerariesService = {
  async getItineraries(tenantId: string, filters?: ItineraryFilters) {
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_template', false)
      .is('deleted_at', null);

    if (filters) {
      if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.booking_id) query = query.eq('booking_id', filters.booking_id);
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Itinerary[];
  },

  async getTemplates(tenantId: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_template', true)
      .is('deleted_at', null)
      .order('template_name', { ascending: true });
    if (error) throw error;
    return data as Itinerary[];
  },

  async getItineraryById(id: string, tenantId?: string) {
    // Fetch itinerary
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null);
    
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data: itinerary, error: iError } = await query.single();
    if (iError) throw iError;

    // Fetch days and items in one or two queries
    const { data: days, error: dError } = await supabase
      .from('itinerary_days')
      .select('*, itinerary_items(*)')
      .eq('itinerary_id', id)
      .is('deleted_at', null)
      .order('day_number', { ascending: true });
    if (dError) throw dError;

    // Nest items and sort them
    const nestedDays = (days || []).map((day: any) => ({
      ...day,
      items: (day.itinerary_items || [])
        .filter((item: any) => !item.deleted_at)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
    }));

    return { ...itinerary, days: nestedDays } as ItineraryWithDetails;
  },

  async getItineraryBySlug(slug: string) {
    const { data: itinerary, error: iError } = await supabase
      .from('itineraries')
      .select('*')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .is('deleted_at', null)
      .single();
    if (iError) return null;

    const { data: days, error: dError } = await supabase
      .from('itinerary_days')
      .select('*, itinerary_items(*)')
      .eq('itinerary_id', itinerary.id)
      .is('deleted_at', null)
      .order('day_number', { ascending: true });

    const nestedDays = (days || []).map((day: any) => ({
      ...day,
      items: (day.itinerary_items || [])
        .filter((item: any) => !item.deleted_at && item.item_type !== 'internal_note')
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
    }));

    return { ...itinerary, days: nestedDays } as ItineraryWithDetails;
  },

  async createItinerary(data: Partial<Itinerary>) {
    const publicSlug = Math.random().toString(36).substring(2, 10);
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .insert({ ...data, public_slug: publicSlug, is_public: false, status: 'draft' })
      .select()
      .single();
    if (error) throw error;
    return itinerary as Itinerary;
  },

  async updateItinerary(id: string, tenantId: string, data: Partial<Itinerary>) {
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return itinerary as Itinerary;
  },

  async deleteItinerary(id: string, tenantId: string) {
    await supabase
      .from('itineraries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  },

  async duplicateItinerary(id: string, overrides: Partial<Itinerary> = {}) {
    const source = await this.getItineraryById(id);
    const { id: _, created_at: __, updated_at: ___, share_token: ____, ...baseData } = source as any;
    
    // Create new itinerary
    const newItinerary = await this.createItinerary({
      ...baseData,
      ...overrides,
      is_shared: false,
      is_template: false,
      template_name: null
    });

    // Duplicate Days and Items
    for (const day of source.days) {
      const { id: dId, itinerary_id: _____, itinerary_items: ______, ...dayData } = day as any;
      const { data: newDay, error: dErr } = await supabase
        .from('itinerary_days')
        .insert({ ...dayData, itinerary_id: newItinerary.id })
        .select()
        .single();
      
      if (dErr) continue;

      if (day.items.length > 0) {
        const itemsToInsert = day.items.map(item => {
          const { id: itId, day_id: _______, ...itData } = item as any;
          return { ...itData, day_id: newDay.id };
        });
        await supabase.from('itinerary_items').insert(itemsToInsert);
      }
    }

    return newItinerary;
  },

  async saveAsTemplate(id: string, templateName: string) {
    return this.duplicateItinerary(id, { is_template: true, template_name: templateName });
  },

  async loadTemplate(id: string, templateId: string) {
    const res = await apiClient.post(`/api/itineraries/${id}/load-template/${templateId}`);
    return res.data;
  },

  async promoteToTemplate(id: string, payload: any) {
    const res = await apiClient.post(`/api/itineraries/${id}/promote-to-template`, payload);
    return res.data;
  },

  // Day Ops
  async addDay(itineraryId: string, tenantId: string, data: Partial<ItineraryDay>) {
    const { data: day, error } = await supabase
      .from('itinerary_days')
      .insert({ ...data, itinerary_id: itineraryId, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return day as ItineraryDay;
  },

  async updateDay(id: string, tenantId: string, data: Partial<ItineraryDay>) {
    const { data: day, error } = await supabase
      .from('itinerary_days')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return day as ItineraryDay;
  },

  async deleteDay(id: string, tenantId: string) {
    await supabase
      .from('itinerary_days')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  },

  async reorderDays(itineraryId: string, tenantId: string, dayIds: string[]) {
    const updates = dayIds.map((id, index) => ({
      id,
      itinerary_id: itineraryId,
      tenant_id: tenantId,
      sort_order: index * 10,
      day_number: index + 1
    }));
    const { error } = await supabase.from('itinerary_days').upsert(updates);
    if (error) throw error;
  },

  // Item Ops
  async addItem(dayId: string, tenantId: string, data: Partial<ItineraryItem>) {
    const { data: item, error } = await supabase
      .from('itinerary_items')
      .insert({ ...data, day_id: dayId, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return item as ItineraryItem;
  },

  async updateItem(id: string, tenantId: string, data: Partial<ItineraryItem>) {
    const { error } = await supabase
      .from('itinerary_items')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  },

  async deleteItem(id: string, tenantId: string) {
    await supabase
      .from('itinerary_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  },

  async reorderItems(dayId: string, tenantId: string, itemIds: string[]) {
    const updates = itemIds.map((id, index) => ({
       id,
       day_id: dayId,
       tenant_id: tenantId,
       sort_order: index * 10
    }));
    const { error } = await supabase.from('itinerary_items').upsert(updates);
    if (error) throw error;
  }
};
