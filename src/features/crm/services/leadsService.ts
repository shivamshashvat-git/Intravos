import { supabase } from '@/core/lib/supabase';
import { Lead, LeadFilters, LeadFollowup, LeadNote, LeadCommunication } from '@/features/crm/types/lead';

export const leadsService = {
  async getLeads(tenantId: string, filters?: LeadFilters, page = 1, pageSize = 25) {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assigned_to && filters.assigned_to !== 'all') {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
      }
      if (filters.date_range) {
        query = query.gte('created_at', filters.date_range.from).lte('created_at', filters.date_range.to);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data as Lead[], count: count || 0 };
  },

  async createLead(data: Partial<Lead>) {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return lead as Lead;
  },

  async updateLead(id: string, data: Partial<Lead>) {
    const { data: lead, error } = await supabase
      .from('leads')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return lead as Lead;
  },

  async deleteLead(id: string) {
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getLeadById(id: string) {
    // Basic lead fetch
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (leadError) throw leadError;

    // Fetch notes and followups
    const [notesRes, followupsRes] = await Promise.all([
      supabase.from('lead_notes').select('*').eq('lead_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('lead_followups').select('*').eq('lead_id', id).is('deleted_at', null).order('due_date', { ascending: true })
    ]);

    return {
      lead: lead as Lead,
      notes: notesRes.data || [],
      followups: (followupsRes.data || []) as LeadFollowup[]
    };
  },

  async getOverdueFollowups(tenantId: string) {
    const { data, error, count } = await supabase
      .from('lead_followups')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_done', false)
      .lt('due_date', new Date().toISOString())
      .is('deleted_at', null);

    if (error) throw error;
    return { data: data as LeadFollowup[], count: count || 0 };
  },

  // Notes
  async getNotes(leadId: string) {
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .is('deleted_at', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeadNote[];
  },

  async createNote(data: Partial<LeadNote>) {
    const { data: note, error } = await supabase.from('lead_notes').insert(data).select().single();
    if (error) throw error;
    return note as LeadNote;
  },

  async deleteNote(id: string) {
    const { error } = await supabase.from('lead_notes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async pinNote(id: string, isPinned: boolean) {
    const { error } = await supabase.from('lead_notes').update({ is_pinned: isPinned }).eq('id', id);
    if (error) throw error;
  },

  // Communications
  async getCommunications(leadId: string) {
    const { data, error } = await supabase
      .from('lead_communications')
      .select('*')
      .eq('lead_id', leadId)
      .order('comm_date', { ascending: false });
    if (error) throw error;
    return data as LeadCommunication[];
  },

  async createCommunication(data: Partial<LeadCommunication>) {
    const { data: comm, error } = await supabase.from('lead_communications').insert(data).select().single();
    if (error) throw error;
    return comm as LeadCommunication;
  },

  // Follow-ups
  async getFollowups(leadId: string) {
    const { data, error } = await supabase
      .from('lead_followups')
      .select('*')
      .eq('lead_id', leadId)
      .is('deleted_at', null)
      .order('is_done', { ascending: true })
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as LeadFollowup[];
  },

  async createFollowup(data: Partial<LeadFollowup>) {
    const { data: followup, error } = await supabase.from('lead_followups').insert(data).select().single();
    if (error) throw error;
    return followup as LeadFollowup;
  },

  async markFollowupDone(id: string) {
    const { error } = await supabase.from('lead_followups').update({ is_done: true }).eq('id', id);
    if (error) throw error;
  },

  async deleteFollowup(id: string) {
    const { error } = await supabase.from('lead_followups').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
};
