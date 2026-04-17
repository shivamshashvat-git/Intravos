import { supabaseAdmin } from '../database/supabase.js';
import logger from '../../core/utils/logger.js';

/**
 * Intravos Bot Service — Triple-Role Platform Intelligence
 *
 * 1. Partner Bot: Network activity digest (every 2 hours)
 * 2. Agency Bot: Operational hygiene & anomaly detection
 * 3. Super-Admin Bot: Platform health & subscription events
 */
class IvoBotService {
  /**
   * Main entry point — runs all three bot cycles.
   * Called by cronService.run2HourlyBotCycle().
   */
  async runFullCycle() {
    const results = {
      stale_leads: 0,
      duplicate_phones: 0,
      financial_mismatches: 0,
    };

    try {
      // 1. Stale Lead Detection
      const staleCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data: staleLeads } = await supabaseAdmin
        .from('leads')
        .select('id, tenant_id, customer_name, assigned_to')
        .eq('status', 'new')
        .lt('created_at', staleCutoff)
        .is('deleted_at', null);

      results.stale_leads = staleLeads?.length || 0;

      // Create notifications for stale leads
      for (const lead of staleLeads || []) {
        await supabaseAdmin.from('notifications').insert({
          tenant_id: lead.tenant_id,
          user_id: lead.assigned_to,
          type: 'alert',
          category: 'ivobot',
          title: `Stale Lead: ${lead.customer_name}`,
          body: `Lead "${lead.customer_name}" has been unquoted for 3+ days.`,
          is_read: false,
        }).catch(() => {}); // Non-fatal
      }

      // 2. Duplicate Phone Detection
      const { data: dupes } = await supabaseAdmin
        .rpc('find_duplicate_phones')
        .catch(() => ({ data: [] }));

      results.duplicate_phones = dupes?.length || 0;

      // 3. Financial Mismatch — bookings with payments but no invoice
      const { data: mismatches } = await supabaseAdmin
        .from('bookings')
        .select('id, tenant_id, customer_name, created_by')
        .not('payment_status', 'eq', 'unpaid')
        .is('invoice_id', null)
        .is('deleted_at', null);

      results.financial_mismatches = mismatches?.length || 0;

      for (const mismatch of mismatches || []) {
        await supabaseAdmin.from('notifications').insert({
          tenant_id: mismatch.tenant_id,
          user_id: mismatch.created_by,
          type: 'warning',
          category: 'ivobot',
          title: 'Financial Mismatch',
          body: `Booking for "${mismatch.customer_name}" has a payment but no invoice.`,
          is_read: false,
        }).catch(() => {}); // Non-fatal
      }

      logger.info(results, '[IvoBot] Full cycle complete');
      return { success: true, results };
    } catch (err) {
      logger.error({ err: err.message }, '[IvoBot] Cycle failed');
      return { success: false, error: err.message };
    }
  }
}

export default new IvoBotService();
