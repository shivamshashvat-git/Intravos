import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * FollowupService — Sales Pipeline Engagement & Task Coordination
 */
class FollowupService {
  /**
   * List followups with multi-dimensional filters
   */
  async listFollowups(tenantId, filters) {
    const { lead_id, user_id, from, to, is_done, page = 1, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('lead_followups')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (from) query = query.gte('due_date', from);
    if (to) query = query.lte('due_date', to);
    if (is_done !== undefined) query = query.eq('is_done', is_done === 'true');

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      followups: data || [],
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  /**
   * Orchestrate a new sales follow-up
   */
  async createFollowup(tenantId, creatorId, payload) {
    const { lead_id, due_date, note, user_id } = payload;
    if (!lead_id || !due_date) throw new Error('lead_id and due_date are required');

    // 1. Validate Lead Integrity
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, destination')
      .eq('id', lead_id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!lead) throw new Error('Lead not found');

    const targetUserId = user_id || creatorId;

    // 2. Insert Followup
    const { data, error } = await supabaseAdmin
      .from('lead_followups')
      .insert({
        tenant_id: tenantId,
        lead_id,
        due_date,
        note: note || null,
        user_id: targetUserId
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Fire Engagement Notification if assigned to others
    if (targetUserId !== creatorId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: targetUserId,
        tenant_id: tenantId,
        notif_type: 'followup_due',
        title: 'New follow-up assigned',
        message: `${lead.customer_name} - ${lead.destination || 'Lead follow-up'}`,
        lead_id
      });
    }

    return data;
  }

  /**
   * Transition follow-up state or assignment
   */
  async updateFollowup(tenantId, userId, followupId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;
    delete updates.lead_id;

    // 1. Fetch current for delta-triggering
    const { data: current } = await supabaseAdmin
      .from('lead_followups')
      .select('*')
      .eq('id', followupId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!current) throw new Error('Follow-up not found');

    // 2. Perform Update
    const { data, error } = await supabaseAdmin
      .from('lead_followups')
      .update(updates)
      .eq('id', followupId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;

    // 3. Re-engagement Notification
    if (updates.user_id && updates.user_id !== current.user_id && updates.user_id !== userId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: updates.user_id,
        tenant_id: tenantId,
        notif_type: 'followup_due',
        title: 'Follow-up assigned to you',
        message: `Follow-up due on ${data.due_date}`,
        lead_id: data.lead_id
      });
    }

    return data;
  }

  /**
   * Retire follow-up
   */
  async deleteFollowup(tenantId, userId, followupId) {
    return await softDeleteDirect({
      table: 'lead_followups',
      id: followupId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Lead follow-up',
      select: 'id, note, deleted_at'
    });
  }
}

export default new FollowupService();
