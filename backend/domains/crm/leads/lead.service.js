import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { normalizePhone } from '../../../core/utils/helpers.js';
import { pushLeadAssigned } from '../../../providers/communication/pushService.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import logger from '../../../core/utils/logger.js';

/**
 * LeadService — Definitive CRM Entry & Lifecycle Management
 */
class LeadService {
  /**
   * Create a lead with auto-customer provisioning
   */
  async createLead(tenantId, userId, leadData, userName) {
    const {
      customer_name, customer_phone: rawPhone, customer_email,
      destination, hotel_name, location, checkin_date, checkout_date,
      guests, rooms, price_seen, source = 'manual', priority = 'normal',
      assigned_to, notes
    } = leadData;

    const customer_phone = normalizePhone(rawPhone);

    // 1. Customer Linking / Provisioning
    let customerId = null;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', customer_phone)
      .is('deleted_at', null)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabaseAdmin
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: customer_name,
          phone: customer_phone,
          email: customer_email || null
        })
        .select('id')
        .single();
      
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    // 2. Duplicate Check (Active leads for same customer)
    const { data: duplicates } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('customer_phone', customer_phone)
      .is('deleted_at', null)
      .not('status', 'in', ['completed', 'cancelled']);

    // 3. Lead Insertion
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .insert({
        tenant_id: tenantId,
        source,
        priority,
        customer_id: customerId,
        customer_name,
        customer_phone,
        customer_email,
        destination,
        hotel_name,
        location,
        checkin_date,
        checkout_date,
        travel_start_date: leadData.travel_start_date || checkin_date || null,
        guests: guests || 1,
        rooms: rooms || 1,
        price_seen,
        assigned_to: assigned_to || userId
      })
      .select()
      .single();

    if (leadErr) throw leadErr;

    // 4. Activity & Note Logging
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: tenantId,
      entity_type: 'lead',
      entity_id: lead.id,
      user_id: userId,
      action: 'created',
      changes: { source, created_by: userName || 'System' }
    });

    if (notes) {
      await supabaseAdmin.from('lead_notes').insert({
        tenant_id: tenantId,
        entity_type: 'lead',
        entity_id: lead.id,
        user_id: userId,
        content: notes
      });
    }

    // 5. Notifications
    const targetAssignee = assigned_to || userId;
    if (targetAssignee !== userId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: targetAssignee,
        tenant_id: tenantId,
        notif_type: 'lead_assigned',
        title: 'New lead assigned to you',
        message: `${customer_name} — ${destination || 'No destination'}`,
        lead_id: lead.id
      });
    }

    // 6. Milestone Check
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('milestones')
      .eq('id', userId)
      .single();

    if (userProfile && !(userProfile.milestones || []).includes('first_lead')) {
      await supabaseAdmin
        .from('users')
        .update({ milestones: [...(userProfile.milestones || []), 'first_lead'] })
        .eq('id', userId);
    }

    return { lead, duplicates: duplicates || [] };
  }

  /**
   * Fetch leads with filtered pagination
   */
  async getAllLeads(tenantId, filters = {}) {
    const { status, source, assigned_to, page = 1, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('leads')
      .select('*, travel_consultant:users!assigned_to(name)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { leads: data, total: count, page: parseInt(page) };
  }

  /**
   * Fetch Single Lead with deep relations
   */
  async getLeadById(tenantId, leadId) {
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select(`*, customers(*), itineraries(*), quotations(*)`)
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return lead;
  }

  /**
   * Update lead with modification tracking
   */
  async updateLead(tenantId, userId, leadId, updates) {
    // 1. Get current state
    const { data: currentLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!currentLead) throw new Error('Lead not found');

    // 2. Perform update
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;

    // 3. Track Modifications
    const trackedFields = [
      'status', 'priority', 'assigned_to', 'destination', 'hotel_name',
      'location', 'checkin_date', 'checkout_date', 'travel_start_date', 'guests', 'rooms',
      'price_seen', 'cost_price', 'margin', 'selling_price'
    ];

    const modifications = [];
    for (const field of trackedFields) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) continue;

      const oldValue = String(currentLead[field] ?? '');
      const newValue = String(lead[field] ?? '');

      if (oldValue !== newValue) {
        modifications.push({
          tenant_id: tenantId, entity_type: 'lead', entity_id: leadId,
          user_id: userId, field, old_value: oldValue, new_value: newValue
        });
      }
    }

    if (modifications.length > 0) {
      await supabaseAdmin.from('activity_logs').insert(modifications);
    }

    // 4. Special Events (Status Change, Reassignment)
    if (updates.status && updates.status !== currentLead.status) {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId, entity_type: 'lead', entity_id: leadId,
        user_id: userId, action: 'status_changed',
        changes: { from: currentLead.status, to: updates.status }
      });
    }

    if (updates.assigned_to && updates.assigned_to !== currentLead.assigned_to) {
      await this._handleReassignment(tenantId, userId, lead, currentLead.assigned_to);
    }

    return lead;
  }

  /**
   * Private helper for reassignment logic
   */
  async _handleReassignment(tenantId, userId, lead, previousOwner) {
    await supabaseAdmin.from('activity_logs').insert({
      tenant_id: tenantId, entity_type: 'lead', entity_id: lead.id,
      user_id: userId, action: 'assigned',
      changes: { previous_owner: previousOwner, new_owner: lead.assigned_to }
    });

    if (lead.assigned_to !== userId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: lead.assigned_to,
        tenant_id: tenantId,
        notif_type: 'lead_assigned',
        title: 'Lead assigned to you',
        message: `${lead.customer_name} — ${lead.destination || 'No destination'}`,
        lead_id: lead.id
      });
      // Fire-and-forget push
      pushLeadAssigned(tenantId, lead.assigned_to, lead).catch(() => {});
    }
  }

  /**
   * Soft Delete Lead with impacts
   */
  async deleteLead(tenantId, userId, leadId) {
    const result = await softDeleteDirect({
      table: 'leads',
      id: leadId,
      tenantId: tenantId,
      user: { id: userId },
      moduleLabel: 'Lead',
      cascadeTo: [
        { table: 'quotations', fkey: 'lead_id' },
        { table: 'invoices', fkey: 'lead_id' }
      ]
    });

    if (result) {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId, entity_type: 'lead', entity_id: leadId,
        user_id: userId, action: 'archived'
      });
    }
    return result;
  }

  /**
   * Orchestrate mass lifecycle transitions
   */
  async bulkUpdateStatus(tenantId, leadIds, status) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) throw new Error('lead_ids array required');

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', leadIds)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select('id');

    if (error) throw error;
    return data || [];
  }

  /**
   * Pipeline Analytics & Conversion Funnel
   */
  async getAnalytics(tenantId) {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('status, budget, profit, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;

    const pipeline = {
      new: 0, contacted: 0, quote_sent: 0, negotiating: 0, converted: 0, lost: 0, on_hold: 0
    };
    
    let totalBudget = 0;
    let totalProfit = 0;
    let convertedCount = 0;

    leads.forEach(l => {
      pipeline[l.status]++;
      if (l.status === 'converted') {
        convertedCount++;
        totalProfit += Number(l.profit || 0);
      }
      totalBudget += Number(l.budget || 0);
    });

    const conversionRate = leads.length > 0 ? (convertedCount / leads.length) * 100 : 0;

    return {
      pipeline_counts: pipeline,
      total_leads: leads.length,
      conversion_rate: conversionRate.toFixed(2),
      average_lead_value: leads.length > 0 ? (totalBudget / leads.length).toFixed(2) : 0,
      total_potential_profit: totalProfit
    };
  }

  /**
   * Lead Notes Logic
   */
  async getLeadNotes(tenantId, leadId) {
    const { data, error } = await supabaseAdmin
      .from('lead_notes')
      .select('*, user:users!user_id(name)')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addLeadNote(tenantId, userId, leadId, content) {
    const { data, error } = await supabaseAdmin
      .from('lead_notes')
      .insert({
        tenant_id: tenantId,
        lead_id: leadId,
        user_id: userId,
        content
      })
      .select('*, user:users!user_id(name)')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Follow-up Management
   */
  async getLeadFollowups(tenantId, leadId) {
    const { data, error } = await supabaseAdmin
      .from('lead_followups')
      .select('*')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async addLeadFollowup(tenantId, userId, leadId, followupData) {
    const { data, error } = await supabaseAdmin
      .from('lead_followups')
      .insert({
        tenant_id: tenantId,
        lead_id: leadId,
        user_id: userId,
        due_date: followupData.followup_date,
        note: followupData.note
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Communication Recording (Lead Specific)
   */
  async recordLeadCommunication(tenantId, userId, leadId, commData) {
    const { data, error } = await supabaseAdmin
      .from('lead_communications')
      .insert({
        tenant_id: tenantId,
        lead_id: leadId,
        user_id: userId,
        comm_type: commData.comm_type,
        direction: commData.direction,
        summary: commData.summary,
        duration_mins: commData.duration_mins,
        comm_date: commData.comm_date || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Stale Lead Detection (for IvoBot)
   * Leads in 'new' status for 3+ days
   */
  async checkStaleLeads() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: staleLeads, error } = await supabaseAdmin
      .from('leads')
      .select('id, tenant_id, customer_name, assigned_to, created_at')
      .eq('status', 'new')
      .lt('created_at', threeDaysAgo.toISOString())
      .is('deleted_at', null);

    if (error) throw error;
    if (!staleLeads || staleLeads.length === 0) return { count: 0 };

    const notifications = [];
    for (const lead of staleLeads) {
      if (lead.assigned_to) {
        notifications.push({
          user_id: lead.assigned_to,
          tenant_id: lead.tenant_id,
          notif_type: 'lead_status_changed',
          title: 'Action Required: Stale Lead',
          message: `${lead.customer_name} has been in "New" status for over 3 days. Please follow up.`,
          lead_id: lead.id
        });
      }
    }

    if (notifications.length > 0) {
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    return { count: staleLeads.length };
  }
}

export default new LeadService();
