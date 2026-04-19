import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';

/**
 * ItineraryService — Enterprise Itinerary Management
 * 
 * Handles deep itinerary trees (Days, Items), sharing logic, 
 * and template management.
 */
class ItineraryService {
  async getItineraries(tenantId, { lead_id, customer_id, is_template, page = 1, limit = 50 }) {
    let query = supabaseAdmin
      .from('itineraries')
      .select('id, title, destination, start_date, end_date, option_label, option_group, is_shared, is_template, template_name, lead_id, customer_id, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (is_template !== undefined) query = query.eq('is_template', is_template === 'true');

    const { data, error, count } = await query;
    if (error) throw error;

    return { itineraries: data, total: count, page: parseInt(page) };
  }

  /**
   * Fetch exhaustive itinerary tree with strict soft-delete filtering
   */
  async getItineraryById(tenantId, itineraryId) {
    const { data: itin, error } = await supabaseAdmin
      .from('itineraries')
      .select('*, itinerary_days(*, itinerary_items(*))')
      .eq('id', itineraryId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!itin) return null;

    // Industrial Hydration: Filter out soft-deleted children and grandchildren
    if (itin.itinerary_days) {
      itin.itinerary_days = itin.itinerary_days
        .filter(day => !day.deleted_at)
        .sort((a, b) => a.sort_order - b.sort_order);

      itin.itinerary_days.forEach(day => {
        if (day.itinerary_items) {
          day.itinerary_items = day.itinerary_items
            .filter(item => !item.deleted_at)
            .sort((a, b) => a.sort_order - b.sort_order);
        }
      });
    }

    return itin;
  }

  /**
   * Fetch itinerary by Booking ID — Industrialized resolution via Lead
   */
  async getItineraryByBooking(tenantId, bookingId) {
    // 1. Resolve Lead/Customer from Booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('lead_id, customer_id')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .single();

    if (!booking || !booking.lead_id) return null;

    // 2. Resolve Itinerary linked to that lead
    const { data: itin, error } = await supabaseAdmin
      .from('itineraries')
      .select('*, itinerary_days(*, itinerary_items(*))')
      .eq('lead_id', booking.lead_id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!itin) return null;

    if (itin.itinerary_days) {
      itin.itinerary_days = itin.itinerary_days
        .filter(day => !day.deleted_at)
        .sort((a, b) => a.day_number - b.day_number);

      itin.itinerary_days.forEach(day => {
        if (day.itinerary_items) {
          day.itinerary_items = day.itinerary_items
            .filter(item => !item.deleted_at)
            .sort((a, b) => a.sort_order - b.sort_order);
        }
      });
    }

    return itin;
  }

  async createItinerary(tenantId, payload) {
    // If booking_id is passed but schema doesn't have it, resolve lead_id
    const { booking_id, ...data } = payload;
    let lead_id = data.lead_id;
    let customer_id = data.customer_id;

    if (booking_id && !lead_id) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('lead_id, customer_id')
        .eq('id', booking_id)
        .eq('tenant_id', tenantId)
        .single();
      
      if (booking) {
        lead_id = booking.lead_id;
        if (!customer_id) customer_id = booking.customer_id;
      }
    }

    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .insert({ ...data, lead_id, customer_id, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return itinerary;
  }

  async updateItinerary(tenantId, itineraryId, updates) {
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .update(updates)
      .eq('id', itineraryId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async duplicateItinerary(tenantId, itineraryId, userId) {
    const original = await this.getItineraryById(tenantId, itineraryId);
    if (!original) throw new Error('Itinerary not found');

    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualUserId = userRec?.id || userId;

    const { id, created_at, updated_at, share_token, is_shared, itinerary_days, ...itinData } = original;

    const { data: copy, error } = await supabaseAdmin
      .from('itineraries')
      .insert({
        ...itinData,
        title: `${itinData.title} (Copy)`,
        is_template: false,
        created_by: actualUserId
      })
      .select()
      .single();

    if (error) throw error;

    // Deep copy days and items
    if (itinerary_days?.length) {
      for (const day of itinerary_days) {
        const { id: dayId, itinerary_id, itinerary_items, ...dayData } = day;
        const { data: newDay } = await supabaseAdmin
          .from('itinerary_days')
          .insert({ ...dayData, itinerary_id: copy.id })
          .select('id')
          .single();

        if (newDay && itinerary_items?.length) {
          const newItems = itinerary_items.map(({ id: itemId, day_id, created_at, ...item }) => ({
            ...item,
            day_id: newDay.id
          }));
          await supabaseAdmin.from('itinerary_items').insert(newItems);
        }
      }
    }

    return copy;
  }

  /**
   * Resolve public itinerary via secure share token
   */
  async resolveShareToken(token) {
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('share_token', token)
      .eq('is_shared', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new Error('Itinerary not found or sharing disabled');
    return data;
  }

  async deleteItinerary(tenantId, userId, itineraryId) {
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', itineraryId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addDay(tenantId, itineraryId, payload) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_days')
      .insert({ ...payload, itinerary_id: itineraryId, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDay(tenantId, dayId, updates) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_days')
      .update(updates)
      .eq('id', dayId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDay(tenantId, dayId) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_days')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dayId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addItem(tenantId, dayId, payload) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_items')
      .insert({ ...payload, day_id: dayId, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(tenantId, itemId, updates) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteItem(tenantId, itemId) {
    const { data, error } = await supabaseAdmin
      .from('itinerary_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk synchronizes day sort order
   */
  async reorderDays(tenantId, itineraryId, orderedIds) {
    if (!Array.isArray(orderedIds)) throw new Error('orderedIds must be an array');

    const updates = orderedIds.map((id, index) => 
      supabaseAdmin
        .from('itinerary_days')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('itinerary_id', itineraryId)
    );

    await Promise.all(updates);
    return { success: true };
  }

  /**
   * Bulk synchronizes item sort order within a day
   */
  async reorderItems(tenantId, dayId, orderedIds) {
    if (!Array.isArray(orderedIds)) throw new Error('orderedIds must be an array');

    const updates = orderedIds.map((id, index) => 
      supabaseAdmin
        .from('itinerary_items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('day_id', dayId)
    );

    await Promise.all(updates);
    return { success: true };
  }

  async loadTemplate(tenantId, itineraryId, templateId) {
    const template = await this.getItineraryById(tenantId, templateId);
    if (!template || !template.is_template) throw new Error('Valid template not found');

    // Delete existing days
    await supabaseAdmin
      .from('itinerary_days')
      .update({ deleted_at: new Date().toISOString() })
      .eq('itinerary_id', itineraryId)
      .eq('tenant_id', tenantId);

    // Deep copy from template
    if (template.itinerary_days?.length) {
      for (const day of template.itinerary_days) {
        const { id, itinerary_id, itinerary_items, created_at, updated_at, ...dayData } = day;
        const { data: newDay } = await supabaseAdmin
          .from('itinerary_days')
          .insert({ ...dayData, itinerary_id: itineraryId, tenant_id: tenantId })
          .select('id')
          .single();

        if (newDay && itinerary_items?.length) {
          const newItems = itinerary_items.map(({ id: itemId, day_id, created_at, updated_at, ...item }) => ({
            ...item,
            day_id: newDay.id,
            tenant_id: tenantId
          }));
          await supabaseAdmin.from('itinerary_items').insert(newItems);
        }
      }
    }
    return { success: true };
  }

  async promoteToTemplate(tenantId, userId, itineraryId, payload) {
    const original = await this.getItineraryById(tenantId, itineraryId);
    if (!original) throw new Error('Itinerary not found');

    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualUserId = userRec?.id || userId;

    const { data: template, error } = await supabaseAdmin
      .from('itineraries')
      .insert({
        ...payload,
        is_template: true,
        tenant_id: tenantId,
        created_by: actualUserId
      })
      .select()
      .single();

    if (error) throw error;

    // Deep copy days and items
    if (original.itinerary_days?.length) {
      for (const day of original.itinerary_days) {
        const { id, itinerary_id, itinerary_items, created_at, updated_at, ...dayData } = day;
        const { data: newDay } = await supabaseAdmin
          .from('itinerary_days')
          .insert({ ...dayData, itinerary_id: template.id, tenant_id: tenantId })
          .select('id')
          .single();

        if (newDay && itinerary_items?.length) {
          const newItems = itinerary_items.map(({ id: itemId, day_id, created_at, updated_at, ...item }) => ({
            ...item,
            day_id: newDay.id,
            tenant_id: tenantId
          }));
          await supabaseAdmin.from('itinerary_items').insert(newItems);
        }
      }
    }
    
    return template;
  }

  async generatePdf(tenantId, itineraryId) {
    const itinerary = await this.getItineraryById(tenantId, itineraryId);
    if (!itinerary) throw new Error('Itinerary not found');

    const branding = await fetchTenantBranding(supabaseAdmin, tenantId);
    return generatePdf('itinerary', itinerary, branding);
  }
}

export default new ItineraryService();
