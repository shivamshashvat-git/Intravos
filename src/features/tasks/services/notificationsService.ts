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

export const notificationsService = {
  async getNotifications(userId: string, tenantId: string, filters?: { type?: string, unread_only?: boolean, page?: number, limit?: number }) {
    const { type, unread_only, page = 1, limit = 20 } = filters || {};
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    if (type && type !== 'all') {
      // Map frontend filters to backend notif_type if necessary
      query = query.eq('notif_type', type);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data: data as Notification[], count: count || 0 };
  },

  async getUnreadNotifications(userId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data as Notification[];
  },

  async getUnreadCount(userId: string, tenantId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .is('deleted_at', null);
    if (error) throw error;
    return count || 0;
  },

  async markAsRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string, tenantId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
};
