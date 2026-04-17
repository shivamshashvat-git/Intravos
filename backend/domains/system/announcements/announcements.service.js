import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * AnnouncementService — Internal Communication & Platform Alert Orchestrator
 */
class AnnouncementService {
  /**
   * Retrieve active announcements for a tenant/user context
   */
  async listActiveAnnouncements(tenantId, userId) {
    const now = new Date().toISOString();

    // Fetch both global announcements (tenant_id is null) AND agency-specific ones
    const { data: announcements, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .lte('starts_at', now)
      .order('starts_at', { ascending: false });

    if (error) throw error;

    const filtered = (announcements || []).filter((item) => !item.ends_at || item.ends_at >= now);

    const { data: dismissals } = await supabaseAdmin
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('user_id', userId);

    const dismissedIds = new Set((dismissals || []).map((item) => item.announcement_id));

    return filtered.map((item) => ({
      ...item,
      dismissed: dismissedIds.has(item.id),
    }));
  }

  /**
   * Record a user dismissal for a specific announcement
   */
  async dismissAnnouncement(userId, announcementId) {
    const { data, error } = await supabaseAdmin
      .from('announcement_dismissals')
      .upsert({
        announcement_id: announcementId,
        user_id: userId,
      }, {
        onConflict: 'announcement_id,user_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new agency-level announcement
   */
  async createAnnouncement(tenantId, userId, payload) {
    const annPayload = {
      tenant_id: tenantId,
      level: 'agency',
      title: payload.title,
      message: payload.message,
      announcement_type: payload.announcement_type || 'info',
      is_active: true,
      starts_at: payload.starts_at || new Date().toISOString(),
      ends_at: payload.ends_at || null,
      created_by: userId
    };

    if (!annPayload.title || !annPayload.message) throw new Error('title and message are required');

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert(annPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new AnnouncementService();
