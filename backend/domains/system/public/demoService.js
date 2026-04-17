import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';
import seedService from '../system/seedService.js';

/**
 * Demo Service — Shareable Demo Console
 *
 * Manages a re-seedable demo tenant for platform walk-throughs.
 * Pre-feeds curated fictional data. Resets automatically on new sessions.
 */
class DemoService {

  /**
   * Reset a demo tenant: wipe all data, then re-seed the golden portfolio.
   */
  async resetDemoTenant(tenantId) {
    logger.info({ tenantId }, '[DemoService] Resetting demo tenant');

    // Verify this is actually a demo tenant
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, is_demo')
      .eq('id', tenantId)
      .single();

    if (!tenant?.is_demo) {
      throw new Error('Cannot reset a non-demo tenant');
    }

    // Order matters: delete from child tables first to respect foreign keys
    // NOTE: Tables without tenant_id must be handled via parent joins/lookups
    const tablesWithTenantId = [
      'lead_activity_log', 'lead_notes', 'lead_communications', 'lead_followups',
      'lead_attachments', 'itineraries',
      'invoices', 'quotations',
      'payment_transactions', 'bookings', 'vouchers', 'visa_tracking',
      'tasks', 'notifications', 'engagement_log', 'calendar_events',
      'customer_documents', 'associated_travelers', 'expenses',
      'leads', 'customers', 'activity_logs',
    ];

    try {
      // 1. Handle orphaned sub-tables (Tables without tenant_id)
      
      // A. Itinerary Tree
      const { data: itins } = await supabaseAdmin
        .from('itineraries')
        .select('id')
        .eq('tenant_id', tenantId);
      
      const itinIds = (itins || []).map(i => i.id);

      if (itinIds.length > 0) {
        const { data: days } = await supabaseAdmin
          .from('itinerary_days')
          .select('id')
          .in('itinerary_id', itinIds);
        
        const dayIds = (days || []).map(d => d.id);

        if (dayIds.length > 0) {
          await supabaseAdmin.from('itinerary_items').delete().in('day_id', dayIds);
        }
        await supabaseAdmin.from('itinerary_days').delete().in('itinerary_id', itinIds);
      }

      // B. Invoice Items
      const { data: invs } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('tenant_id', tenantId);
      
      const invIds = (invs || []).map(i => i.id);
      if (invIds.length > 0) {
        await supabaseAdmin.from('invoice_items').delete().in('invoice_id', invIds);
      }

      // C. Quotation Items
      const { data: quotes } = await supabaseAdmin
        .from('quotations')
        .select('id')
        .eq('tenant_id', tenantId);
      
      const quoteIds = (quotes || []).map(q => q.id);
      if (quoteIds.length > 0) {
        await supabaseAdmin.from('quotation_items').delete().in('quotation_id', quoteIds);
      }

      // D. Visa Documents
      const { data: visas } = await supabaseAdmin
        .from('visa_tracking')
        .select('id')
        .eq('tenant_id', tenantId);
      
      const visaIds = (visas || []).map(v => v.id);
      if (visaIds.length > 0) {
        await supabaseAdmin.from('visa_documents').delete().in('visa_tracking_id', visaIds);
      }

      // 2. Handle standard tables (with tenant_id)
      for (const table of tablesWithTenantId) {
        // Handle Itineraries after sub-tables (already fetch above but delete in sequence)
        await supabaseAdmin.from(table).delete().eq('tenant_id', tenantId);
      }

      logger.info({ tenantId }, '[DemoService] Tables wiped. Injecting fresh seed data...');
      
      // Delegate injection to the Seed Engine
      await this.seedDemoData(tenantId);

      logger.info({ tenantId }, '[DemoService] Demo tenant reset successful');
      return { success: true };
    } catch (error) {
      logger.error({ tenantId, error: error.message }, '[DemoService] Reset failed');
      throw error;
    }
  }

  /**
   * Seed the golden portfolio — curated, high-quality fictional data.
   */
  async seedDemoData(tenantId) {
    return seedService.injectSeed(tenantId, 'demo_portfolio.json');
  }
}

export default new DemoService();
