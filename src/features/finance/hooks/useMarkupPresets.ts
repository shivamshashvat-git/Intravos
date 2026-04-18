import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/hooks/useAuth';
import { markupPresetsService } from '../services/markupPresetsService';
import { MarkupPreset, CreateMarkupPresetInput } from '../types/markupPreset';
import { toast } from 'sonner';

export const useMarkupPresets = () => {
  const { tenant } = useAuth();
  const [presets, setPresets] = useState<MarkupPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = tenant?.features_enabled?.includes('markup_presets');

  const fetchPresets = useCallback(async () => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await markupPresetsService.getMarkupPresets();
      setPresets(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      toast.error('Failed to load markup presets');
    } finally {
      setLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const createPreset = async (data: CreateMarkupPresetInput) => {
    try {
      await markupPresetsService.createMarkupPreset(data);
      toast.success('Markup preset created');
      await fetchPresets();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create preset');
      throw e;
    }
  };

  const updatePreset = async (id: string, data: Partial<CreateMarkupPresetInput>) => {
    try {
      await markupPresetsService.updateMarkupPreset(id, data);
      toast.success('Markup preset updated');
      await fetchPresets();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update preset');
      throw e;
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await markupPresetsService.deleteMarkupPreset(id);
      toast.success('Markup preset deleted');
      await fetchPresets();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete preset');
      throw e;
    }
  };

  const setDefault = async (id: string) => {
    try {
      await markupPresetsService.setDefault(id);
      toast.success('Default preset updated');
      await fetchPresets();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update default');
    }
  };

  return {
    presets,
    loading,
    error,
    isEnabled,
    createPreset,
    updatePreset,
    deletePreset,
    setDefault,
    refresh: fetchPresets
  };
};
