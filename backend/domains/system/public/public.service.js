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
}

export default new PublicService();
