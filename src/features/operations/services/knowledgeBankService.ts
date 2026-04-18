import { supabase } from '@/core/lib/supabase';
import { itinerariesService } from './itinerariesService';
import { CreateTemplateInput, ItineraryTemplate, DetailedTemplate } from '../types/knowledgeBank';

export const knowledgeBankService = {
  async getTemplates(tenantId: string, filters?: any) {
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_template', true)
      .is('deleted_at', null);

    if (filters) {
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.destination) {
        query = query.ilike('destination', `%${filters.destination}%`);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as ItineraryTemplate[];
  },

  async getTemplate(id: string): Promise<DetailedTemplate> {
    const data = await itinerariesService.getItineraryById(id);
    return data as DetailedTemplate;
  },

  async createTemplate(tenantId: string, data: CreateTemplateInput): Promise<ItineraryTemplate> {
    const publicSlug = Math.random().toString(36).substring(2, 10);
    const { data: template, error } = await supabase
      .from('itineraries')
      .insert({ 
        ...data, 
        tenant_id: tenantId, 
        is_template: true,
        public_slug: publicSlug,
        is_public: !!data.is_public,
        status: 'ready',
        total_days: data.duration_days
      })
      .select()
      .single();
    if (error) throw error;
    return template as ItineraryTemplate;
  },

  async updateTemplate(id: string, tenantId: string, data: Partial<ItineraryTemplate>): Promise<ItineraryTemplate> {
    // Ensure we don't accidentally unset is_template
    const payload = { ...data, is_template: true };
    const { data: template, error } = await supabase
      .from('itineraries')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return template as ItineraryTemplate;
  },

  async deleteTemplate(id: string, tenantId: string): Promise<void> {
    return itinerariesService.deleteItinerary(id, tenantId);
  },

  async duplicateTemplate(id: string): Promise<ItineraryTemplate> {
    // Force is_template: true and remove client links
    return itinerariesService.duplicateItinerary(id, { 
      is_template: true, 
      lead_id: null, 
      customer_id: null, 
      booking_id: null 
    }) as Promise<ItineraryTemplate>;
  }
};
