import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * WorkspaceService — Internal Team Collaboration & Contextual Messaging Orchestrator
 */
class WorkspaceService {
  /**
   * Retrieve collaboration stream for a specific channel or reference object
   */
  async getMessages(tenantId, filters = {}) {
    const { channel = 'general', reference_type, reference_id } = filters;
    
    let query = supabaseAdmin
      .from('workspace_messages')
      .select(`
        *,
        user:user_id (id, name, role)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (reference_type && reference_id) {
      query = query.eq('reference_type', reference_type).eq('reference_id', reference_id);
    } else {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Append a message to the team workspace or a contextual thread
   */
  async sendMessage(tenantId, userId, payload) {
    const { message, channel = 'general', reference_type, reference_id, parent_id } = payload;
    if (!message) throw new Error('message is required');

    const { data, error } = await supabaseAdmin
      .from('workspace_messages')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        message,
        channel,
        reference_type,
        reference_id,
        parent_id
      })
      .select(`
        *,
        user:user_id (id, name, role)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}

export default new WorkspaceService();
