import { apiClient } from '@/core/lib/apiClient';

export interface InsurancePolicy {
  id: string;
  booking_id?: string;
  customer_id: string;
  provider_name: string;
  policy_number: string;
  coverage_type: 'medical' | 'trip' | 'both';
  premium_amount: number;
  coverage_start: string;
  coverage_end: string;
  status: 'active' | 'expired' | 'claimed';
  notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: { name: string };
  booking?: { booking_ref: string };
}

export const insuranceService = {
  getPolicies: async (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const res = await apiClient(`/api/operations/insurance?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    const data = await res.json();
    return data.policies as InsurancePolicy[];
  },

  getPolicy: async (id: string) => {
    const res = await apiClient(`/api/operations/insurance/${id}`);
    if (!res.ok) throw new Error('Failed to fetch policy');
    const data = await res.json();
    return data.policy as InsurancePolicy;
  },

  createPolicy: async (payload: Partial<InsurancePolicy>) => {
    const res = await apiClient('/api/operations/insurance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create policy');
    const data = await res.json();
    return data.policy as InsurancePolicy;
  },

  updatePolicy: async (id: string, payload: Partial<InsurancePolicy>) => {
    const res = await apiClient(`/api/operations/insurance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update policy');
    const data = await res.json();
    return data.policy as InsurancePolicy;
  },

  deletePolicy: async (id: string) => {
    const res = await apiClient(`/api/operations/insurance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete policy');
    return res.json();
  }
};
