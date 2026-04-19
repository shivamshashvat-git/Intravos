import { apiClient } from '@/core/lib/apiClient';

const BASE = '/api/system/users';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const usersService = {
  async listUsers(): Promise<UserSummary[]> {
    const res = await apiClient(BASE, {
      method: 'GET'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }

    const { data } = await res.json();
    return data.users || [];
  }
};
