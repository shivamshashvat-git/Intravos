import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * CalendarService — Global Event Aggregator & Persistent Timeline
 */
class CalendarService {
  /**
   * Aggregate events from various modules for a date range
   */
  async getEvents(tenantId, from, to, features = []) {
    if (!from || !to) throw new Error('Date range (from/to) required');

    const events = [];

    // 1. Leads: Departures & Returns
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, destination, checkin_date, checkout_date, status, assigned_to')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled')
      .or(`checkin_date.gte.${from},checkout_date.gte.${from}`)
      .or(`checkin_date.lte.${to},checkout_date.lte.${to}`);

    (leads || []).forEach(lead => {
      if (lead.checkin_date >= from && lead.checkin_date <= to) {
        events.push({
          id: `departure-${lead.id}`,
          event_type: 'departure',
          title: `Departure: ${lead.customer_name}`,
          date: lead.checkin_date,
          metadata: { lead_id: lead.id, destination: lead.destination, assigned_to: lead.assigned_to }
        });
      }
      if (lead.checkout_date >= from && lead.checkout_date <= to && lead.checkout_date !== lead.checkin_date) {
        events.push({
          id: `checkout-${lead.id}`,
          event_type: 'checkout',
          title: `Return: ${lead.customer_name}`,
          date: lead.checkout_date,
          metadata: { lead_id: lead.id, destination: lead.destination }
        });
      }
    });

    // 2. Follow-ups & Tasks
    const [{ data: followups }, { data: tasks }] = await Promise.all([
      supabaseAdmin.from('lead_followups').select('id, lead_id, due_date, note, leads(customer_name)').eq('tenant_id', tenantId).is('deleted_at', null).eq('is_done', false).gte('due_date', from).lte('due_date', to),
      supabaseAdmin.from('tasks').select('id, title, due_date, assigned_to, lead_id').eq('tenant_id', tenantId).is('deleted_at', null).eq('is_done', false).gte('due_date', from).lte('due_date', to)
    ]);

    (followups || []).forEach(fu => events.push({
      id: `followup-${fu.id}`,
      event_type: 'followup',
      title: `Follow-up: ${fu.leads?.customer_name || 'Prospect'}`,
      date: fu.due_date,
      metadata: { lead_id: fu.lead_id, note: fu.note }
    }));

    (tasks || []).forEach(task => events.push({
      id: `task-${task.id}`,
      event_type: 'task_due',
      title: `Task: ${task.title}`,
      date: task.due_date,
      metadata: { task_id: task.id, assigned_to: task.assigned_to }
    }));

    // 3. Optional Module: Visa Appointments
    if (features.includes('visa_tracking')) {
      const { data: visas } = await supabaseAdmin.from('visa_tracking').select('id, traveler_name, destination, appointment_date').eq('tenant_id', tenantId).is('deleted_at', null).not('appointment_date', 'is', null).gte('appointment_date', from).lte('appointment_date', to);
      (visas || []).forEach(v => events.push({
        id: `visa-${v.id}`,
        event_type: 'visa_appointment',
        title: `Visa Appt: ${v.traveler_name}`,
        date: v.appointment_date,
        metadata: { destination: v.destination }
      }));
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Sync persistent calendar_events for heavy reporting
   */
  async syncPersistentEvents(tenantId, userId, features = []) {
    // Standard procedure: Purge and Re-populate
    await supabaseAdmin.from('calendar_events').update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq('tenant_id', tenantId).is('deleted_at', null);

    const inserts = [];
    const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]; // -30 days
    const to = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]; // +1 year

    const rawEvents = await this.getEvents(tenantId, from, to, features);

    rawEvents.forEach(e => {
      inserts.push({
        tenant_id: tenantId,
        event_type: e.event_type,
        title: e.title,
        event_date: e.date,
        metadata: e.metadata,
        lead_id: e.metadata.lead_id || null,
        user_id: e.metadata.assigned_to || null
      });
    });

    if (inserts.length > 0) {
      const { error } = await supabaseAdmin.from('calendar_events').insert(inserts);
      if (error) throw error;
    }

    return { events_synced: inserts.length };
  }
}

export default new CalendarService();
