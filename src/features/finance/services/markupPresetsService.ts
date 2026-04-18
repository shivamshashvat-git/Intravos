import { apiClient } from '@/core/lib/apiClient';
import { supabase } from '@/core/lib/supabase';
import { MarkupPreset, CreateMarkupPresetInput } from '../types/markupPreset';

const BASE_URL = 'http://localhost:3000/api/finance/markup-presets';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  };
};

export const markupPresetsService = {
  async getMarkupPresets(): Promise<MarkupPreset[]> {
    const response = await apiClient(BASE_URL, {
      method: 'GET',
      headers: await getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch markup presets');
    }
    
    const { data } = await response.json();
    return data.presets || [];
  },

  async createMarkupPreset(data: CreateMarkupPresetInput): Promise<MarkupPreset> {
    const response = await apiClient(BASE_URL, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create markup preset');
    }
    
    const { data: result } = await response.json();
    return result.preset;
  },

  async updateMarkupPreset(id: string, data: Partial<CreateMarkupPresetInput>): Promise<MarkupPreset> {
    const response = await apiClient(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update markup preset');
    }
    
    const { data: result } = await response.json();
    return result.preset;
  },

  async deleteMarkupPreset(id: string): Promise<void> {
    const response = await apiClient(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: await getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete markup preset');
    }
  },

  async setDefault(id: string): Promise<MarkupPreset> {
    return this.updateMarkupPreset(id, { is_default: true } as any);
  }
};
