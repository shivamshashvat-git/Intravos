import { supabaseAdmin } from '../../../providers/database/supabase.js';

class NotificationService {
  async listNotifications(tenantId, userId, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async markAsRead(tenantId, userId, notificationId) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async markAllAsRead(tenantId, userId) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { ok: true };
  }

  // Helper for other domains to trigger notifications
  async createNotification(tenantId, notification) {
      const { data, error } = await supabaseAdmin
          .from('notifications')
          .insert({
              tenant_id: tenantId,
              ...notification
          })
          .select()
          .single();
      
      if (error) throw error;
      return data;
  }
}

export default new NotificationService();
