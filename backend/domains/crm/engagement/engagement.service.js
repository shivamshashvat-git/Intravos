import { supabaseAdmin } from '../../../providers/database/supabase.js';
import messageService from '../../../providers/communication/messageService.js';

/**
 * EngagementService — CRM Relationship & Communication Orchestrator
 */
class EngagementService {
  /**
   * Compute comprehensive engagement feed
   */
  async getFeed(tenantId) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAhead = new Date(Date.now() + 7 * 86400000);
    const weekAheadStr = weekAhead.toISOString().split('T')[0];

    // 1. Fetch customers with important dates
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, important_dates')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('important_dates', 'eq', '[]');

    const birthdays = [];
    const anniversaries = [];

    for (const customer of customers || []) {
      for (const dateEntry of customer.important_dates || []) {
        const date = this._nextOccurrence(dateEntry.date);
        if (!date || date < today || date > weekAhead) continue;

        const template = dateEntry.type === 'birthday'
          ? 'Happy Birthday {{customer_name}}! Wishing you a wonderful year ahead.'
          : 'Happy Anniversary {{customer_name}}! Wishing you many more joyful journeys.';
        
        const msg = await messageService.render(template, { customer_name: customer.name });

        const item = {
          customer_id: customer.id,
          customer_name: customer.name,
          phone: customer.phone,
          date: date.toISOString().split('T')[0],
          days_away: this._daysAway(date),
          whatsapp_url: customer.phone ? messageService.getWhatsAppLink(customer.phone, msg) : null
        };

        if (dateEntry.type === 'birthday') birthdays.push(item);
        else if (dateEntry.type === 'anniversary') anniversaries.push(item);
      }
    }

    // 2. Fetch departures today
    const { data: departures } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, customer_phone, destination, checkin_date')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('checkin_date', todayStr)
      .not('status', 'in', ['cancelled']);

    const mappedDepartures = (departures || []).map(item => {
      const msg = `Hi ${item.customer_name}, wishing you a smooth trip to ${item.destination || 'your destination'}!`;
      return {
        ...item,
        whatsapp_url: item.customer_phone ? messageService.getWhatsAppLink(item.customer_phone, msg) : null
      };
    });

    // 3. Post-trip follow-ups (3 days after checkout)
    const postTripDate = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const { data: postTrip } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, customer_phone, destination, checkout_date')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('checkout_date', postTripDate)
      .in('status', ['booked', 'completed']);

    const mappedPostTrip = (postTrip || []).map(item => {
      const msg = `Hi ${item.customer_name}, we hope you enjoyed your recent trip. We would love your feedback.`;
      return {
        ...item,
        whatsapp_url: item.customer_phone ? messageService.getWhatsAppLink(item.customer_phone, msg) : null
      };
    });

    // 4. Dormant Customers Scan (6 months since last checkout)
    const activeTrips = await supabaseAdmin
      .from('leads')
      .select('customer_id, customer_phone, checkout_date, updated_at')
      .eq('tenant_id', tenantId)
      .in('status', ['booked', 'completed'])
      .order('checkout_date', { ascending: false });

    const lastTripByCustomer = new Map();
    for (const trip of activeTrips.data || []) {
      const key = trip.customer_id || `phone:${trip.customer_phone}`;
      if (!lastTripByCustomer.has(key)) lastTripByCustomer.set(key, trip);
    }

    const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);
    const dormant = [];

    for (const customer of customers || []) {
      const key = customer.id || `phone:${customer.phone}`;
      const lastTrip = lastTripByCustomer.get(key);

      if (!lastTrip) {
        dormant.push({
          customer_id: customer.id,
          customer_name: customer.name,
          phone: customer.phone,
          last_trip_date: null,
          whatsapp_url: customer.phone ? messageService.getWhatsAppLink(customer.phone, `Hi ${customer.name}, it's been a while! Thinking of your next trip?`) : null
        });
        continue;
      }

      const lastTripDate = new Date(lastTrip.checkout_date || lastTrip.updated_at);
      if (lastTripDate <= sixMonthsAgo) {
        dormant.push({
          customer_id: customer.id,
          customer_name: customer.name,
          phone: customer.phone,
          last_trip_date: (lastTrip.checkout_date || '').split('T')[0] || null,
          days_since_trip: Math.floor((Date.now() - lastTripDate.getTime()) / 86400000),
          whatsapp_url: customer.phone ? messageService.getWhatsAppLink(customer.phone, `Hi ${customer.name}, we're checking in to see when you're ready for your next adventure!`) : null
        });
      }
    }

    return {
      feed: {
        birthdays_this_week: birthdays.sort((a, b) => a.days_away - b.days_away),
        anniversaries_this_week: anniversaries.sort((a, b) => a.days_away - b.days_away),
        departures_today: mappedDepartures,
        post_trip_followups: mappedPostTrip,
        dormant_customers: dormant
      },
      range: { from: todayStr, to: weekAheadStr }
    };
  }

  /**
   * List active communication blueprints
   */
  async getTemplates(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  /**
   * Register a new communication blueprint
   */
  async createTemplate(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Persist engagement intent and render link
   */
  async recordEngagement(tenantId, userId, payload) {
    const { customer_id, template_id, phone, message, date, destination } = payload;
    if (!customer_id) throw new Error('customer_id is required');

    const { data: cust, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('phone, name')
      .eq('id', customer_id)
      .eq('tenant_id', tenantId)
      .single();

    if (custErr || !cust) throw new Error('Customer not found');

    const destPhone = phone || cust.phone;
    let text = message;

    if (!text && template_id) {
      const { data: tpl } = await supabaseAdmin
        .from('message_templates')
        .select('template_text')
        .eq('id', template_id)
        .eq('tenant_id', tenantId)
        .single();
      
      text = messageService.render(tpl?.template_text || '', {
        customer_name: cust.name || '',
        date: date || '',
        destination: destination || ''
      });
    }

    const whatsappUrl = destPhone ? messageService.getWhatsAppLink(destPhone, text) : null;

    // Log the engagement audit trail
    await supabaseAdmin.from('engagement_log').insert({
      tenant_id: tenantId,
      user_id: userId,
      customer_id,
      engagement_type: 'manual',
      channel: 'whatsapp',
      template_id: template_id || null,
      message_sent: text
    });

    return { whatsapp_url: whatsappUrl };
  }

  // --- INTERNAL UTILITIES ---

  _nextOccurrence(rawDate) {
    if (!rawDate) return null;
    const now = new Date();
    const parts = String(rawDate).split('-');
    let month, day;

    if (parts.length === 3 && parts[0].length === 4) {
      month = Number(parts[1]); 
      day = Number(parts[2]);
    } else if (parts.length === 2) {
      month = Number(parts[0]);
      day = Number(parts[1]);
    } else return null;

    let date = new Date(Date.UTC(now.getUTCFullYear(), month - 1, day));
    if (date < new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))) {
      date = new Date(Date.UTC(now.getUTCFullYear() + 1, month - 1, day));
    }
    return date;
  }

  _daysAway(date) {
    return Math.ceil((date - new Date()) / 86400000);
  }
}

export default new EngagementService();
