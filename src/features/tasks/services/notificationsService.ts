import { supabase } from '@/core/lib/supabase';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  notif_type: string;
  title: string;
  message: string;
  is_read: boolean;
  lead_id: string | null;
  booking_id: string | null;
  task_id: string | null;
  created_at: string;
}

const getHeaders = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionData.session?.access_token}`
  };
};

export const notificationsService = {
  async getNotifications(userId: string, tenantId: string, filters?: { type?: string, unread_only?: boolean, page?: number, limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.unread_only) params.append('unread_only', 'true');
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/system/notifications?${params.toString()}`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const result = await res.json();
    return { data: result.data?.notifications || [], count: result.data?.total || 0 };
  },

  async getUnreadNotifications(userId: string, tenantId: string) {
    const result = await this.getNotifications(userId, tenantId, { unread_only: true, limit: 20 });
    return result.data;
  },

  async getUnreadCount(userId: string, tenantId: string) {
    const result = await this.getNotifications(userId, tenantId, { unread_only: true, limit: 1 });
    return result.count;
  },

  async markAsRead(id: string) {
    const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/system/notifications/${id}/read`, {
      method: 'PATCH',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark read');
  },

  async markAllAsRead(userId: string, tenantId: string) {
    const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/system/notifications/read-all`, {
      method: 'PATCH',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark all read');
  },

  async deleteNotification(id: string) {
    const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/system/notifications/${id}`, {
      method: 'DELETE',
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete notification');
  }
};
