import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadFilters } from '@/features/crm/types/lead';
import { leadsService } from '@/features/crm/services/leadsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useLeads(initialFilters: LeadFilters = {}) {
  const { tenant } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LeadFilters>(initialFilters);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    convertedThisMonth: 0,
    overdueFollowups: 0
  });

  const fetchLeads = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const { data, count } = await leadsService.getLeads(tenant.id, filters, page);
      setLeads(data);
      setTotalCount(count);

      // Fetch Stats in parallel
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const [allRes, activeRes, convertedRes, overdueRes] = await Promise.all([
         leadsService.getLeads(tenant.id, {}), // Total all time
         leadsService.getLeads(tenant.id, { status: undefined }), // Simplified for now
         leadsService.getLeads(tenant.id, { status: 'converted', date_range: { from: firstDayOfMonth, to: now.toISOString() } }),
         leadsService.getOverdueFollowups(tenant.id)
      ]);

      // Refined active calculation (status not in converted/lost)
      const { data: activeLeadsData } = await leadsService.getLeads(tenant.id);
      const activeCount = activeLeadsData.filter(l => l.status !== 'converted' && l.status !== 'lost').length;

      setStats({
        total: allRes.count,
        active: activeCount,
        convertedThisMonth: convertedRes.count,
        overdueFollowups: overdueRes.count
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadOptimistically = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const addLeadOptimistically = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
    setTotalCount(prev => prev + 1);
  };

  return {
    leads,
    totalCount,
    isLoading,
    page,
    setPage,
    filters,
    setFilters,
    stats,
    refreshLeads: fetchLeads,
    updateLeadOptimistically,
    addLeadOptimistically
  };
}
