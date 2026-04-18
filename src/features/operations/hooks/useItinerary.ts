import { useState, useEffect, useCallback, useRef } from 'react';
import { ItineraryWithDetails, ItineraryDay, ItineraryItem, ItineraryItemType } from '@/features/operations/types/itinerary';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { useAuth } from '@/core/hooks/useAuth';

export function useItinerary(id: string) {
  const { tenant } = useAuth();
  const [data, setData] = useState<ItineraryWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const fetchData = useCallback(async () => {
    if (!id || !tenant?.id) return;
    setIsLoading(true);
    try {
      const res = await itinerariesService.getItineraryById(id, tenant.id);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id, tenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optimistic Helpers
  const updateLocalDay = (dayId: string, updates: Partial<ItineraryDay>) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(d => d.id === dayId ? { ...d, ...updates } : d)
      };
    });
  };

  const updateLocalItem = (itemId: string, updates: Partial<ItineraryItem>) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(d => ({
          ...d,
          items: d.items.map(it => it.id === itemId ? { ...it, ...updates } : it)
        }))
      };
    });
  };

  // Actions
  const addDay = async () => {
    if (!data || !tenant?.id) return;
    const sortOrder = data.days.length > 0 ? Math.max(...data.days.map(d => d.sort_order)) + 10 : 0;
    const newDay = await itinerariesService.addDay(data.id, tenant.id, {
       day_number: data.days.length + 1,
       sort_order: sortOrder,
       title: `Day ${data.days.length + 1}`
    });
    setData({ ...data, days: [...data.days, { ...newDay, items: [] }] });
  };

  const updateDay = async (dayId: string, updates: Partial<ItineraryDay>) => {
    updateLocalDay(dayId, updates);
    if (debounceTimers.current[dayId]) clearTimeout(debounceTimers.current[dayId]);
    debounceTimers.current[dayId] = setTimeout(async () => {
      setIsSaving(true);
      try { await itinerariesService.updateDay(dayId, tenant!.id, updates); } catch (e) { fetchData(); }
      setIsSaving(false);
    }, 800);
  };

  const deleteDay = async (dayId: string) => {
    if (!window.confirm('Delete this day and all its items?')) return;
    setData(prev => prev ? { ...prev, days: prev.days.filter(d => d.id !== dayId) } : null);
    await itinerariesService.deleteDay(dayId, tenant!.id);
  };

  const addItem = async (dayId: string, type: ItineraryItemType) => {
    const day = data?.days.find(d => d.id === dayId);
    if (!day || !tenant?.id) return;
    const sortOrder = day.items.length > 0 ? Math.max(...day.items.map(i => i.sort_order)) + 10 : 0;
    const newItem = await itinerariesService.addItem(dayId, tenant.id, {
       item_type: type,
       title: 'New ' + type,
       sort_order: sortOrder
    });
    setData(prev => {
       if (!prev) return null;
       return {
         ...prev,
         days: prev.days.map(d => d.id === dayId ? { ...d, items: [...d.items, newItem] } : d)
       };
    });
    return newItem;
  };

  const updateItem = async (itemId: string, updates: Partial<ItineraryItem>) => {
    updateLocalItem(itemId, updates);
    if (debounceTimers.current[itemId]) clearTimeout(debounceTimers.current[itemId]);
    debounceTimers.current[itemId] = setTimeout(async () => {
       setIsSaving(true);
       try { await itinerariesService.updateItem(itemId, tenant!.id, updates); } catch (e) { fetchData(); }
       setIsSaving(false);
    }, 800);
  };

  const deleteItem = async (itemId: string) => {
    setData(prev => {
       if (!prev) return null;
       return {
         ...prev,
         days: prev.days.map(d => ({
           ...d,
           items: d.items.filter(it => it.id !== itemId)
         }))
       };
    });
    await itinerariesService.deleteItem(itemId, tenant!.id);
  };

  const reorderDays = async (dayIds: string[]) => {
    setData(prev => {
      if (!prev) return null;
      const sortedDays = dayIds.map((id, idx) => {
        const d = prev.days.find(day => day.id === id)!;
        return { ...d, day_number: idx + 1, sort_order: idx * 10 };
      });
      return { ...prev, days: sortedDays };
    });
    await itinerariesService.reorderDays(id, tenant!.id, dayIds);
  };

  const reorderItemsInDay = async (dayId: string, itemIds: string[]) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(d => {
           if (d.id !== dayId) return d;
           const sortedItems = itemIds.map((id, idx) => {
              const it = d.items.find(i => i.id === id)!;
              return { ...it, sort_order: idx * 10 };
           });
           return { ...d, items: sortedItems };
        })
      };
    });
    await itinerariesService.reorderItems(dayId, tenant!.id, itemIds);
  };

  const updateItinerary = async (updates: Partial<ItineraryWithDetails>) => {
    if (!data || !tenant?.id) return;
    setData({ ...data, ...updates });
    await itinerariesService.updateItinerary(data.id, tenant.id, updates as any);
  };

  const toggleShare = async () => {
    if (!data || !tenant?.id) return;
    const newShare = !data.is_public;
    const updates = { is_public: newShare, status: (newShare ? 'shared' : 'ready') as any };
    setData({ ...data, ...updates });
    await itinerariesService.updateItinerary(data.id, tenant.id, updates);
  };

  return {
    itinerary: data,
    isLoading,
    isSaving,
    addDay,
    updateDay,
    deleteDay,
    reorderDays,
    addItem,
    updateItem,
    deleteItem,
    reorderItemsInDay,
    toggleShare,
    updateItinerary,
    refreshItinerary: fetchData
  };
}
