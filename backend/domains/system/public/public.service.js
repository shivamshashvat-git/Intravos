import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * PublicService — External Integration & Open Discovery Orchestrator
 */
class PublicService {
  /**
   * Ingest external leads from third-party websites or APIs
   */
  async ingestLead(tenantId, payload) {
    const { 
      customer_name, email, phone, 
      destination, travel_date, traveler_count, 
      message, source_url 
    } = payload;

    if (!customer_name) throw new Error('customer_name is required');

    // Insert lead
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        tenant_id: tenantId,
        customer_name,
        email: email || null,
        phone: phone || null,
        destination: destination || null,
        travel_date: travel_date || null,
        pax: traveler_count || 1,
        notes: message || `Source: ${source_url || 'External API'}`,
        source: 'api',
        status: 'new',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) throw error;

    // Orchestrate administrative alerts
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (admin) {
      await supabaseAdmin.from('notifications').insert({
        tenant_id: tenantId,
        user_id: admin.id,
        type: 'alert',
        category: 'lead',
        title: 'New API Lead Ingested',
        body: `New lead from ${customer_name} for ${destination || 'Unknown'}.`,
        metadata: { lead_id: lead.id }
      });
    }

    return lead;
  }

  /**
   * Fetch published itinerary offers for public listing
   */
  async listPublishedOffers(tenantId) {
    const { data: offers, error } = await supabaseAdmin
      .from('itineraries')
      .select('id, title, destination, cover_image, selling_price, inclusions')
      .eq('tenant_id', tenantId)
      .eq('is_published', true)
      .eq('is_template', true)
      .is('deleted_at', null)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return offers || [];
  }

  async getTripSitePayload(token) {
    const { data: itinerary } = await supabaseAdmin
      .from('itineraries')
      .select('*, itinerary_days(*, itinerary_items(*)), leads(*)')
      .or(`public_slug.eq.${token},share_token.eq.${token}`)
      .is('deleted_at', null)
      .single();

    if (!itinerary) return null;

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', itinerary.tenant_id)
      .single();

    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('lead_id', itinerary.lead_id)
      .is('deleted_at', null);

    let lifecycle_state = 'proposal';
    if (itinerary.leads?.status === 'booked' || (invoices && invoices.length > 0)) {
       const today = new Date();
       const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
       const endDate = itinerary.end_date ? new Date(itinerary.end_date) : null;
       
       if (startDate && startDate <= today && endDate && endDate >= today) {
         lifecycle_state = 'traveling';
       } else {
         lifecycle_state = 'confirmed';
       }
    }

    const days = (itinerary.itinerary_days || []).filter(d => !d.deleted_at).sort((a,b) => a.sort_order - b.sort_order).map(day => {
      const items = (day.itinerary_items || []).filter(i => !i.deleted_at && i.item_type !== 'internal_note').sort((a,b) => a.sort_order - b.sort_order).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        item_type: item.item_type,
        time_val: item.time_val,
        location: item.location,
        duration: item.duration,
      }));
      return {
        id: day.id,
        day_number: day.day_number,
        title: day.title,
        description: day.description,
        items
      };
    });

    const safeInvoices = (invoices || []).map(inv => ({
      id: inv.id,
      number: inv.invoice_number,
      status: inv.status,
      total: inv.total,
      amount_paid: inv.amount_paid || 0,
      balance_due: inv.total - (inv.amount_paid || 0),
      due_date: inv.due_date,
      payment_link_url: inv.payment_link_url,
      pay_now_enabled: (inv.total - (inv.amount_paid || 0)) > 0
    }));

    return {
      trip: {
        id: itinerary.id,
        title: itinerary.title,
        destination: itinerary.destination,
        description: itinerary.description || itinerary.notes,
        start_date: itinerary.start_date,
        end_date: itinerary.end_date,
        duration_days: days.length,
        cover_image_url: itinerary.cover_image,
        lifecycle_state,
        share_token: token,
        agency: {
          name: tenant?.name || 'Travel Agency',
          support_phone: tenant?.agency_phone,
          support_email: tenant?.agency_email,
        },
        traveler: {
          name: itinerary.customer_name || itinerary.leads?.customer_name,
        },
        stats: {
          day_count: days.length,
          hotel_count: days.flatMap(d => d.items).filter(i => i.item_type === 'hotel').length,
          activity_count: days.flatMap(d => d.items).filter(i => i.item_type === 'activity').length,
          transfer_count: days.flatMap(d => d.items).filter(i => i.item_type === 'transfer').length,
        }
      },
      itinerary_days: days,
      quote_summary: {
         total: itinerary.selling_price || 0,
         status: itinerary.leads?.status || 'open'
      },
      invoices: safeInvoices,
      actions: {
        can_approve: lifecycle_state === 'proposal',
        can_request_changes: lifecycle_state === 'proposal',
        can_pay: safeInvoices.some(i => i.pay_now_enabled)
      }
    };
  }

  async approveTrip(token) {
    const { data: itinerary } = await supabaseAdmin.from('itineraries').select('lead_id').or(`public_slug.eq.${token},share_token.eq.${token}`).single();
    if (itinerary?.lead_id) {
       await supabaseAdmin.from('leads').update({ status: 'won' }).eq('id', itinerary.lead_id);
    }
    return { success: true };
  }

  async requestTripChanges(token, payload) {
     const { data: itinerary } = await supabaseAdmin.from('itineraries').select('id, tenant_id').or(`public_slug.eq.${token},share_token.eq.${token}`).single();
     if (itinerary) {
        const { data: admin } = await supabaseAdmin.from('users').select('id').eq('tenant_id', itinerary.tenant_id).eq('role', 'admin').limit(1).single();
        if (admin) {
           await supabaseAdmin.from('notifications').insert({
             tenant_id: itinerary.tenant_id,
             user_id: admin.id,
             type: 'alert',
             category: 'itinerary',
             title: 'Client Requested Changes',
             body: payload.note || 'Client requested changes to their itinerary.',
             metadata: { itinerary_id: itinerary.id }
           });
        }
     }
  }

  async handlePaymentWebhook(payload) {
     if (payload.invoice_id && payload.status === 'captured') {
        const { data: inv } = await supabaseAdmin.from('invoices').select('*').eq('id', payload.invoice_id).single();
        if (inv) {
           await supabaseAdmin.from('invoices').update({ 
              amount_paid: (inv.amount_paid || 0) + payload.amount,
              status: ((inv.amount_paid || 0) + payload.amount) >= inv.total ? 'paid' : 'partial'
           }).eq('id', payload.invoice_id);
        }
     }
  }
}

export default new PublicService();
