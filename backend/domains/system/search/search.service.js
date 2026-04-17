import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * SearchService — Global Multi-Module Intelligent Discovery Orchestrator
 */
class SearchService {
  /**
   * Execute cross-module search across core CRM and operational entities
   */
  async globalSearch(tenantId, query, limit = 5) {
    const q = String(query || '').trim();
    if (q.length < 2) throw new Error('Search query must be at least 2 characters');

    const searchLimit = Math.min(parseInt(limit, 10) || 5, 20);
    const likePattern = `%${q}%`;

    const parallelQueries = [
      supabaseAdmin.from('customers').select('id, name, phone, email').eq('tenant_id', tenantId).is('deleted_at', null).or(`name.ilike.${likePattern},phone.ilike.${likePattern},email.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('leads').select('id, customer_name, customer_phone, destination, status').eq('tenant_id', tenantId).is('deleted_at', null).or(`customer_name.ilike.${likePattern},customer_phone.ilike.${likePattern},destination.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('quotations').select('id, quote_number, customer_name, destination, status').eq('tenant_id', tenantId).is('deleted_at', null).or(`quote_number.ilike.${likePattern},customer_name.ilike.${likePattern},destination.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('invoices').select('id, invoice_number, customer_name, status, total').eq('tenant_id', tenantId).is('deleted_at', null).or(`invoice_number.ilike.${likePattern},customer_name.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('itineraries').select('id, title, destination, start_date, end_date').eq('tenant_id', tenantId).is('deleted_at', null).or(`title.ilike.${likePattern},destination.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('bookings').select('id, booking_ref, destination, status').eq('tenant_id', tenantId).is('deleted_at', null).or(`booking_ref.ilike.${likePattern},destination.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('visa_tracking').select('id, traveler_name, destination, status').eq('tenant_id', tenantId).is('deleted_at', null).or(`traveler_name.ilike.${likePattern},destination.ilike.${likePattern}`).limit(searchLimit),
      supabaseAdmin.from('tasks').select('id, title, due_date, is_done').eq('tenant_id', tenantId).is('deleted_at', null).ilike('title', likePattern).limit(searchLimit),
      supabaseAdmin.from('lead_followups').select('id, note, due_date, lead_id').eq('tenant_id', tenantId).is('deleted_at', null).ilike('note', likePattern).limit(searchLimit),
    ];

    const results = await Promise.all(parallelQueries);
    
    // Error Aggregation
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;

    return {
      query: q,
      results: {
        customers: results[0].data || [],
        leads: results[1].data || [],
        quotations: results[2].data || [],
        invoices: results[3].data || [],
        itineraries: results[4].data || [],
        bookings: results[5].data || [],
        visa: results[6].data || [],
        tasks: results[7].data || [],
        followups: results[8].data || []
      }
    };
  }
}

export default new SearchService();
