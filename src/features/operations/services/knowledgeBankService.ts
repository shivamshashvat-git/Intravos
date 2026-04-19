import { apiClient } from '@/core/lib/apiClient';
import { itinerariesService } from './itinerariesService';
import { CreateTemplateInput, ItineraryTemplate, DetailedTemplate } from '../types/knowledgeBank';

export const knowledgeBankService = {
  async getTemplates(tenantId: string, filters?: any) {
    const params = new URLSearchParams();
    params.append('is_template', 'true');
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.destination) params.append('destination', filters.destination);
    if (filters?.search) params.append('search', filters.search);

    const res = await apiClient(`/api/operations/itineraries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    const result = await res.json();
    return result.data?.itineraries || result.data as ItineraryTemplate[];
  },

  async getTemplate(id: string): Promise<DetailedTemplate> {
    const data = await itinerariesService.getItineraryById(id);
    return data as DetailedTemplate;
  },

  async createTemplate(tenantId: string, data: CreateTemplateInput): Promise<ItineraryTemplate> {
    const payload = {
      ...data,
      is_template: true,
      is_public: !!data.is_public,
      status: 'ready',
      total_days: data.duration_days
    };
    
    const res = await apiClient(`/api/operations/itineraries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create template');
    const result = await res.json();
    return result.data?.itinerary || result.data as ItineraryTemplate;
  },

  async updateTemplate(id: string, tenantId: string, data: Partial<ItineraryTemplate>): Promise<ItineraryTemplate> {
    const payload = { ...data, is_template: true };
    const res = await apiClient(`/api/operations/itineraries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update template');
    const result = await res.json();
    return result.data?.itinerary || result.data as ItineraryTemplate;
  },

  async deleteTemplate(id: string, tenantId: string): Promise<void> {
    return itinerariesService.deleteItinerary(id, tenantId);
  },

  async duplicateTemplate(id: string): Promise<ItineraryTemplate> {
    return itinerariesService.duplicateItinerary(id, { 
      is_template: true, 
      lead_id: null, 
      customer_id: null, 
      booking_id: null 
    }) as Promise<ItineraryTemplate>;
  }
};
