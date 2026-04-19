import { apiClient } from '@/core/lib/apiClient';
import { Lead, LeadFilters, LeadFollowup, LeadNote, LeadCommunication } from '@/features/crm/types/lead';

const BASE = '/api/crm/leads';

export const leadsService = {
  async getLeads(tenantId: string, filters?: LeadFilters, page = 1, pageSize = 25) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.assigned_to && filters.assigned_to !== 'all') params.append('assigned_to', filters.assigned_to);
      if (filters.search) params.append('search', filters.search);
    }
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());

    const response = await apiClient(`${BASE}?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch leads');
    }

    const { data } = await response.json();
    return { data: (data.leads || []) as Lead[], count: data.total || 0 };
  },

  async createLead(data: Partial<Lead>) {
    const response = await apiClient(BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create lead');
    }

    const { data: result } = await response.json();
    return (result.lead || result) as Lead;
  },

  async updateLead(id: string, data: Partial<Lead>) {
    const response = await apiClient(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update lead');
    }

    const { data: result } = await response.json();
    return (result.lead || result) as Lead;
  },

  async deleteLead(id: string) {
    const response = await apiClient(`${BASE}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete lead');
    }
  },

  async getLeadById(id: string) {
    const response = await apiClient(`${BASE}/${id}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch lead');
    }

    const { data } = await response.json();
    return data;
  },

  async getOverdueFollowups(tenantId: string) {
    // Cross-lead overdue followups — relies on backend endpoint if available.
    // Fallback to empty until dedicated endpoint is wired.
    return { data: [] as LeadFollowup[], count: 0 };
  },

  // Notes
  async getNotes(leadId: string) {
    return [] as LeadNote[]; // Typically loaded via getLeadById
  },

  async createNote(data: Partial<LeadNote>) {
    const response = await apiClient(`${BASE}/${data.lead_id}/notes`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        content: data.content,
        is_pinned: data.is_pinned,
        user_id: data.user_id
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create note');
    }

    const { data: result } = await response.json();
    return result as LeadNote;
  },

  async deleteNote(id: string) {
    // Stub — requires dedicated backend endpoint
  },

  async pinNote(id: string, isPinned: boolean) {
    // Stub — requires dedicated backend endpoint
  },

  // Communications
  async getCommunications(leadId: string) {
    return [] as LeadCommunication[];
  },

  async createCommunication(data: Partial<LeadCommunication>) {
    const response = await apiClient(`${BASE}/${data.lead_id}/communications`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to log communication');
    }

    const { data: result } = await response.json();
    return result as LeadCommunication;
  },

  // Follow-ups
  async getFollowups(leadId: string) {
    return [] as LeadFollowup[];
  },

  async createFollowup(data: Partial<LeadFollowup>) {
    // Stub — relies on centralized API if available
    return {} as any;
  },

  async markFollowupDone(id: string) {
    // Stub — requires dedicated backend endpoint
  },

  async deleteFollowup(id: string) {
    // Stub — requires dedicated backend endpoint
  }
};
