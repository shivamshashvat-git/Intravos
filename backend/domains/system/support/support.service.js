import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * SupportService — Support Desk & Feature Request Orchestrator
 */
class SupportService {
  /**
   * List all support tickets for a tenant
   */
  async listTickets(tenantId, type = 'support') {
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (type !== 'all') {
      query = query.eq('ticket_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch ticket details with historical conversation
   */
  async getTicket(tenantId, ticketId) {
    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !ticket) throw new Error('Ticket not found');

    const { data: replies } = await supabaseAdmin
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    return { ticket, replies: replies || [] };
  }

  /**
   * Register a new support or feature request
   */
  async createTicket(tenantId, userId, payload) {
    const { subject, description, screenshot_url, browser_info, page_url, ticket_type = 'support' } = payload;
    if (!subject || !description) throw new Error('subject and description are required');

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        subject,
        description,
        screenshot_url,
        browser_info,
        page_url,
        ticket_type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Append a reply to a support thread
   */
  async addReply(tenantId, userId, role, ticketId, message) {
    if (!message) throw new Error('message is required');

    // Ownership/Access check
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!ticket) throw new Error('Ticket not found');

    const { data, error } = await supabaseAdmin
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        message,
        is_admin: role === 'super_admin',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark ticket as closed/resolved
   */
  async resolveTicket(tenantId, userId, ticketId, resolution) {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolution: resolution || null,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return data;
  }

  /**
   * Retire ticket record
   */
  async deleteTicket(tenantId, userId, ticketId) {
    return await softDeleteDirect({
      table: 'support_tickets',
      id: ticketId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Support ticket',
    });
  }
}

export default new SupportService();
