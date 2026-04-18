import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/hooks/useAuth';
import { knowledgeBankService } from '../services/knowledgeBankService';
import { ItineraryTemplate, CreateTemplateInput, TemplateCategory } from '../types/knowledgeBank';
import { toast } from 'sonner';

export const useKnowledgeBank = () => {
  const { tenant } = useAuth();
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: 'all' as TemplateCategory | 'all',
    destination: '',
    tags: [] as string[]
  });

  const isEnabled = tenant?.features_enabled?.includes('itineraries');

  const fetchTemplates = useCallback(async () => {
    if (!tenant?.id || !isEnabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await knowledgeBankService.getTemplates(tenant.id, {
        ...filters,
        search
      });
      setTemplates(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      toast.error('Failed to load blueprint repository');
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, isEnabled, search, filters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (data: CreateTemplateInput) => {
    if (!tenant?.id) return;
    try {
      const template = await knowledgeBankService.createTemplate(tenant.id, data);
      toast.success('New blueprint registered in knowledge bank');
      await fetchTemplates();
      return template;
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const updateTemplate = async (id: string, data: Partial<ItineraryTemplate>) => {
    if (!tenant?.id) return;
    try {
      await knowledgeBankService.updateTemplate(id, tenant.id, data);
      toast.success('Blueprint protocol updated');
      await fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!tenant?.id) return;
    try {
      await knowledgeBankService.deleteTemplate(id, tenant.id);
      toast.success('Blueprint retired from repository');
      await fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      await knowledgeBankService.duplicateTemplate(id);
      toast.success('Blueprint duplicated in repository');
      await fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      destination: '',
      tags: []
    });
    setSearch('');
  };

  return {
    templates,
    isLoading,
    error,
    isEnabled,
    search,
    setSearch,
    filters,
    setFilter,
    clearFilters,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    refresh: fetchTemplates
  };
};
