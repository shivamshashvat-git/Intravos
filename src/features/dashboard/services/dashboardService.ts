import { apiClient } from '@/core/lib/apiClient';
import { DashboardData } from '@/features/dashboard/types/dashboard';

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api/system/dashboard';

export const dashboardService = {
  async getDashboardData(tenantId: string, userId: string): Promise<DashboardData> {
    const res = await apiClient(BASE_URL);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch dashboard data');
    }
    const { data } = await res.json();
    return data as DashboardData;
  },

  async writeCacheUpdate(tenantId: string, stats: any) {
    // This is now purely handled server side on actual updates if needed, so we can mock or do nothing.
    // Preserving the API signature if the UI calls it.
    console.debug('writeCacheUpdate is now managed server-side. Call ignored.');
  }
};
