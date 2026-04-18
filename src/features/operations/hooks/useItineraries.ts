import { useState, useEffect, useCallback } from 'react';
import { Itinerary, ItineraryFilters } from '@/features/operations/types/itinerary';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { useAuth } from '@/core/hooks/useAuth';

export function useItineraries(initialFilters: ItineraryFilters = {}) {
  const { tenant } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [templates, setTemplates] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ItineraryFilters>(initialFilters);
  const [stats, setStats] = useState({
    total: 0,
    shared: 0,
    templates: 0
  });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const [itData, tData] = await Promise.all([
        itinerariesService.getItineraries(tenant.id, filters),
        itinerariesService.getTemplates(tenant.id)
      ]);
      setItineraries(itData);
      setTemplates(tData);
      
      setStats({
        total: itData.length,
        shared: itData.filter(i => i.is_shared).length,
        templates: tData.length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    itineraries,
    templates,
    stats,
    isLoading,
    filters,
    setFilters,
    refresh: fetchData
  };
}
