import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

class CalendarService {
  async getEventsInRange(tenantId, fromDate, toDate, typeFilter = null) {
    let query = supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('start_date', fromDate)
      .lte('start_date', toDate);

    if (typeFilter) {
      query = query.eq('event_type', typeFilter);
    }

    const { data: events, error } = await query;
    if (error) throw error;
    return events || [];
  }

  async createEvent(tenantId, userId, payload) {
    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        ...payload,
        tenant_id: tenantId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEvent(tenantId, eventId, payload) {
    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .update(payload)
      .eq('id', eventId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEvent(tenantId, eventId, user = null) {
    return await softDeleteDirect({
      table: 'calendar_events',
      id: eventId,
      tenantId,
      user,
      moduleLabel: 'Calendar'
    });
  }

  async getAgenda(tenantId, fromDate, toDate) {
    // Collect direct calendar events
    const calendarEvents = await this.getEventsInRange(tenantId, fromDate, toDate);
    const unified = [...calendarEvents];

    // Collect upcoming booking departures
    const { data: bookings, error: bErr } = await supabaseAdmin
      .from('bookings')
      .select('id, title, travel_date_start, travel_date_end, booking_number, pax_adults, pax_children, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled')
      .gte('travel_date_start', fromDate)
      .lte('travel_date_start', toDate);

    if (!bErr && bookings) {
      bookings.forEach(b => {
        unified.push({
          id: `dep_${b.id}`,
          title: `Departure: ${b.title}`,
          event_type: 'departure',
          start_date: b.travel_date_start,
          status: b.status,
          metadata: {
            booking_id: b.id,
            booking_ref: b.booking_number,
            pax: (b.pax_adults || 0) + (b.pax_children || 0)
          }
        });
      });
    }

    // Collect active tasks with due_date
    const { data: tasks, error: tErr } = await supabaseAdmin
      .from('tasks')
      .select('id, title, due_date, due_time, priority, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'in', '("completed","cancelled")')
      .gte('due_date', fromDate)
      .lte('due_date', toDate);

    if (!tErr && tasks) {
      tasks.forEach(t => {
        unified.push({
          id: `tsk_${t.id}`,
          title: `Task Due: ${t.title}`,
          event_type: 'task_due',
          start_date: t.due_date,
          start_time: t.due_time,
          status: t.status,
          metadata: {
            task_id: t.id,
            priority: t.priority
          }
        });
      });
    }

    // Attempt to pull visa appointments if available
    const { data: visas, error: vErr } = await supabaseAdmin
      .from('visa_tracking')
      .select('id, application_number, appointment_date, appointment_time, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('appointment_date', fromDate)
      .lte('appointment_date', toDate);
      
    if (!vErr && visas) {
        visas.forEach(v => {
            if(v.appointment_date) {
                unified.push({
                    id: `visa_${v.id}`,
                    title: `Visa Appt: ${v.application_number}`,
                    event_type: 'visa_appointment',
                    start_date: v.appointment_date,
                    start_time: v.appointment_time,
                    status: v.status,
                    metadata: {
                        visa_id: v.id,
                        visa_ref: v.application_number
                    }
                });
            }
        });
    }

    // Sort by start_date
    unified.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    return unified;
  }
}

export default new CalendarService();
