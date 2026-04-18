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

  async markAsRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string, tenantId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }
};
