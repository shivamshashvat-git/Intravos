import { apiClient } from '@/core/lib/apiClient';
import { TrashRecord } from '../types/trash';

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api/trash';

export const trashService = {
  async getTrash(): Promise<{ trash: TrashRecord[], grouped: Record<string, TrashRecord[]>, total: number }> {
    const res = await apiClient(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch trash');
    const { data } = await res.json();
    return data;
  },

  async restoreRecord(table: string, id: string) {
    const res = await apiClient(`${BASE_URL}/${table}/${id}/restore`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Restoration failed');
    return res.json();
  },

  async permanentlyDelete(table: string, id: string) {
    const res = await apiClient(`${BASE_URL}/${table}/${id}/permanent-delete`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Permanent deletion failed');
    return res.json();
  }
};
