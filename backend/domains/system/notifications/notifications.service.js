import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * NotificationService — Multi-Tenant Communication & Alert Orchestrator
 */
class NotificationService {
  /**
   * List notifications for a specific user within a tenant
   */
  async listNotifications(tenantId, userId, filters = {}) {
    const { page = 1, limit = 20, unread_only = false } = filters;
    
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (unread_only === true || unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { notifications: data || [], total: count, page: parseInt(page) };
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(tenantId, userId, notificationId) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Notification not found');
    return data;
  }

  /**
   * Batch mark all notifications as read for a user
   */
  async markAllAsRead(tenantId, userId) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Internal Method: Dispatch a notification (System Level)
   */
  async dispatchNotification(tenantId, userId, payload) {
    const { type, subject, message, data, priority = 'normal' } = payload;
    
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        type: type || 'system',
        subject,
        message,
        data: data || {},
        priority
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }
}

export default new NotificationService();
