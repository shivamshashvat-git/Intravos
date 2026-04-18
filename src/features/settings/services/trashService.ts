import { apiClient } from '@/core/lib/apiClient';
import { supabase } from '@/core/lib/supabase';
import { TrashRecord } from '../types/trash';

const BASE_URL = 'http://localhost:3000/api/trash';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`
  };
};

export const trashService = {
  async getTrash(): Promise<{ trash: TrashRecord[], grouped: Record<string, TrashRecord[]>, total: number }> {
    const res = await apiClient(BASE_URL, {
      method: 'GET',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch trash');
    const { data } = await res.json();
    return data;
  },

  async restoreRecord(table: string, id: string) {
    const res = await apiClient(`${BASE_URL}/${table}/${id}/restore`, {
      method: 'POST',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Restoration failed');
    return res.json();
  },

  async permanentlyDelete(table: string, id: string) {
    const res = await apiClient(`${BASE_URL}/${table}/${id}/permanent-delete`, {
      method: 'POST',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Permanent deletion failed');
    return res.json();
  }
};
