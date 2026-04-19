
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
      const res = await itinerariesService.getItineraryById(id);
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
        days: (prev.days || []).map(d => d.id === dayId ? { ...d, ...updates } : d)
      };
    });
  };

  const updateLocalItem = (itemId: string, updates: Partial<ItineraryItem>) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: (prev.days || []).map(d => ({
          ...d,
          items: d.items.map(it => it.id === itemId ? { ...it, ...updates } : it)
        }))
      };
    });
  };

  // Actions
  const addDay = async () => {
    if (!data || !tenant?.id) return;
    const sortOrder = (data.days || []).length > 0 ? Math.max(...data.days.map(d => d.sort_order)) + 10 : 0;
    const newDay = await itinerariesService.addDay(data.id, {
       day_number: (data.days || []).length + 1,
       sort_order: sortOrder,
       title: `Day ${(data.days || []).length + 1}`
    });
    setData({ ...data, days: [...(data.days || []), { ...newDay, items: [] }] });
  };

  const updateDay = async (dayId: string, updates: Partial<ItineraryDay>) => {
    updateLocalDay(dayId, updates);
    if (debounceTimers.current[dayId]) clearTimeout(debounceTimers.current[dayId]);
    debounceTimers.current[dayId] = setTimeout(async () => {
      setIsSaving(true);
      try { await itinerariesService.updateDay(dayId, updates); } catch (e) { fetchData(); }
      setIsSaving(false);
    }, 800);
  };

  const deleteDay = async (dayId: string) => {
    if (!window.confirm('Delete this day and all its items?')) return;
    setData(prev => prev ? { ...prev, days: prev.days.filter(d => d.id !== dayId) } : null);
    await itinerariesService.deleteDay(dayId);
  };

  const addItem = async (dayId: string, type: ItineraryItemType) => {
    const day = data?.days.find(d => d.id === dayId);
    if (!day || !tenant?.id) return;
    const sortOrder = day.items.length > 0 ? Math.max(...day.items.map(i => i.sort_order)) + 10 : 0;
    const newItem = await itinerariesService.addItem(dayId, {
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
       try { await itinerariesService.updateItem(itemId, updates); } catch (e) { fetchData(); }
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
    await itinerariesService.deleteItem(itemId);
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
    await itinerariesService.reorderItems(dayId, itemIds);
  };

  const updateItinerary = async (updates: Partial<ItineraryWithDetails>) => {
    if (!data || !tenant?.id) return;
    setData({ ...data, ...updates });
    await itinerariesService.updateItinerary(data.id, updates as any);
  };

  const generatePdf = async () => {
    if (!data) return;
    const blob = await itinerariesService.generatePdf(data.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Itinerary-${data.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    itinerary: data,
    isLoading,
    isSaving,
    addDay,
    updateDay,
    deleteDay,
    addItem,
    updateItem,
    deleteItem,
    reorderItemsInDay,
    updateItinerary,
    generatePdf,
    refreshItinerary: fetchData
  };
}
