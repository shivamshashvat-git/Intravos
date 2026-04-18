import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import { DashboardData } from '@/features/dashboard/types/dashboard';
import { useAuth } from '@/core/hooks/useAuth';

export function useDashboard() {
  const { tenant, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem('dismissed_dashboard_alerts');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  const fetchData = useCallback(async (isManual = false) => {
    if (!tenant?.id || !user?.id) return;
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const result = await dashboardService.getDashboardData(tenant.id, user.id);
      setData(result);
      setLastRefreshed(new Date());
      // Background cache update
      dashboardService.writeCacheUpdate(tenant.id, result).catch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tenant?.id, user?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 300000); // 5 mins
    return () => clearInterval(interval);
  }, [fetchData]);

  const dismissAlert = (key: string) => {
    const next = new Set(dismissedAlerts);
    next.add(key);
    setDismissedAlerts(next);
    sessionStorage.setItem('dismissed_dashboard_alerts', JSON.stringify(Array.from(next)));
  };

  return {
    data,
    isLoading,
    isRefreshing,
    lastRefreshed,
    dismissedAlerts,
    dismissAlert,
    refresh: () => fetchData(true)
  };
}
