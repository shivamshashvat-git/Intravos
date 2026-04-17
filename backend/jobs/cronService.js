import logger from '../core/utils/logger.js';
import taskAutomation from '../domains/operations/tasks/taskAutomation.js';
import healthService from '../domains/system/system/healthService.js';
import ivoBot from '../providers/communication/IvoBotService.js';
import { supabaseAdmin } from '../providers/database/supabase.js';
import { TRASH_TABLES } from '../core/utils/softDelete.js';
import { databaseBackupTask } from './databaseBackupTask.js';

/**
 * CronService
 * Orchestrates platform-wide background maintenance.
 * Designed to be triggered by a system cron (e.g. Supabase pg_cron or GitHub Action).
 */
class CronService {
  /**
   * Main Maintenance Loop — runs daily at 2:00 AM
   * Tasks: Materializing recurring items, updating health scores, dashboard cache.
   */
  async runDailyMaintenance() {
    logger.info('[CronService] Starting Daily Maintenance...');
    const results = { tasks: 0, health_updates: 0, cache_updated: false };

    try {
      // 1. Materialize Recurring Tasks
      const taskResult = await taskAutomation.materializeTasks();
      results.tasks = taskResult.count;
      logger.info(`[CronService] Materialized ${results.tasks} recurring tasks.`);

      // 2. Update Customer Health Scores for all active tenants
      const { data: tenants } = await supabaseAdmin.from('tenants').select('id');
      for (const tenant of tenants || []) {
        const updates = await healthService.updateCustomerHealth(tenant.id);
        results.health_updates += updates.length;
      }
      logger.info(`[CronService] Updated health scores for ${results.health_updates} customers.`);

      // 3. Refresh Dashboard Stats Cache
      await this.refreshDashboardCache();
      results.cache_updated = true;

      // 4. Subscription Cleanup: Proactively suspend expired accounts
      await this.batchUpdateSubscriptionStatus();

      // 5. TRASH RETENTION: Purge items older than 30 days
      await this.purgeExpiredTrash();

      // 6. INTERNAL BACKUP: 90-day external backup to Google Drive
      try {
        await databaseBackupTask();
      } catch (backupErr) {
        logger.error('[CronService] Non-fatal backup warning:', backupErr.message);
      }

      return { success: true, results };
    } catch (err) {
      logger.error('[CronService] Maintenance Failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Intravos Bot 2-Hourly Cycle
   * Runs the triple-role bot: Partner digest, Agency hygiene, Platform health.
   */
  async run2HourlyBotCycle() {
    return ivoBot.runFullCycle();
  }

  /**
   * Dashboard Stats Cache Refresh
   * Pre-aggregates key metrics per tenant for instant dashboard loads.
   */
  async refreshDashboardCache() {
    logger.info('[CronService] Refreshing dashboard stats cache...');

    try {
      const { data: tenants } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('is_active', true);

      const processTenant = async (tid) => {
        const [revenueRes, bookingRes, leadRes, pendingRes] = await Promise.all([
          supabaseAdmin.from('payment_transactions').select('amount').eq('tenant_id', tid).is('deleted_at', null),
          supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).is('deleted_at', null),
          supabaseAdmin.from('leads').select('id, status', { count: 'exact' }).eq('tenant_id', tid).is('deleted_at', null),
          supabaseAdmin.from('invoices').select('total').eq('tenant_id', tid).in('status', ['sent', 'partially_paid']).is('deleted_at', null),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalBookings = bookingRes.count || 0;
        const leads = leadRes.data || [];
        const activeLeads = leads.filter(l => !['completed', 'cancelled'].includes(l.status)).length;
        const bookedLeads = leads.filter(l => l.status === 'booked').length;
        const conversionRate = leads.length > 0 ? Math.round((bookedLeads / leads.length) * 10000) / 100 : 0;
        const pendingPayments = (pendingRes.data || []).reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

        await supabaseAdmin
          .from('dashboard_stats_cache')
          .upsert({
            tenant_id: tid,
            total_revenue: totalRevenue,
            total_bookings: totalBookings,
            active_leads: activeLeads,
            conversion_rate: conversionRate,
            pending_payments: pendingPayments,
            calculated_at: new Date().toISOString(),
          }, { onConflict: 'tenant_id' });
      };

      // Process in batches of 10 to avoid overwhelming Supabase
      const allTenants = tenants || [];
      const BATCH_SIZE = 10;
      for (let i = 0; i < allTenants.length; i += BATCH_SIZE) {
        const batch = allTenants.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(t => processTenant(t.id)));
      }

      logger.info(`[CronService] Dashboard cache refreshed for ${tenants?.length || 0} tenants.`);
    } catch (err) {
      logger.error('[CronService] Dashboard cache refresh failed:', err.message);
    }
  }

  /*
   * (Removed) Auto-Escalation Rules - Disabled to avoid synthetic task flooding and over-engineered blockades.
   */
  async runAutoEscalation() {
    logger.info('[CronService] Auto-escalation disabled.');
  }

  /**
   * Recalculate Storage Usage
   * Pulls the actual physical file size used per tenant from Supabase's storage
   * metadata, ensuring perfectly synced storage accounting.
   */
  async recalculateStorageUsage() {
    logger.info('[CronService] Recalculating tenant storage quotas...');
    try {
      // Get all active tenants
      const { data: tenants } = await supabaseAdmin.from('tenants').select('id, slug');
      
      for (const tenant of tenants || []) {
        // Query the hidden storage schema via RPC. 
        // Note: we'll create an RPC 'get_tenant_storage_size' for this since we can't query storage schema directly from client lib easily.
        const { data, error } = await supabaseAdmin.rpc('get_tenant_storage_size', { p_slug: tenant.slug });
        
        if (!error && data !== null) {
           const sizeMB = Math.ceil(data / (1024 * 1024));
           await supabaseAdmin.from('tenants').update({ storage_used_mb: sizeMB }).eq('id', tenant.id);
        }
      }
    } catch (err) {
      logger.error('[CronService] Storage calculation failed:', err.message);
    }
  }

  /**
   * Batch Update Subscription Status
   * Automatically suspends trial/active accounts that have reached their end date.
   */
  async batchUpdateSubscriptionStatus() {
    logger.info('[CronService] Checking for expired subscriptions...');
    
    try {
      const now = new Date().toISOString();

      // Part 1: Suspend expired Trials
      const { data: trials, error: trialErr } = await supabaseAdmin
        .from('tenants')
        .update({ subscription_status: 'suspended', is_active: false })
        .eq('subscription_status', 'trial')
        .lt('trial_end', now)
        .select('id, name');

      if (trialErr) throw trialErr;
      if (trials?.length > 0) {
        logger.info(`[CronService] Suspended ${trials.length} expired trials.`);
      }

      // Part 2: Suspend expired Active Plans (Grace period already handled by date)
      const { data: actives, error: activeErr } = await supabaseAdmin
        .from('tenants')
        .update({ subscription_status: 'suspended', is_active: false })
        .in('subscription_status', ['active', 'grace'])
        .lt('subscription_end_date', now)
        .select('id, name');

      if (activeErr) throw activeErr;
      if (actives?.length > 0) {
        logger.info(`[CronService] Suspended ${actives.length} expired active plans.`);
      }

    } catch (err) {
      logger.error('[CronService] Subscription cleanup failed:', err.message);
    }
  }

  /**
   * Purge Expired Trash
   * Permanently deletes any soft-deleted record older than 30 days.
   */
  async purgeExpiredTrash() {
    logger.info('[CronService] Purging expired trash items (30-day policy)...');
    try {
      const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const tables = Object.keys(TRASH_TABLES);
      
      let totalPurged = 0;

      for (const table of tables) {
        const { error, count } = await supabaseAdmin
          .from(table)
          .delete()
          .lt('deleted_at', threshold)
          .not('deleted_at', 'is', null); // Only target rows with non-null deleted_at

        if (!error) {
          // Note: .delete() doesn't return count by default in some Supabase versions unless configured,
          // but logically this will clean up the data.
          totalPurged++; 
        }
      }
      logger.info(`[CronService] Trash purge cycle complete for ${tables.length} modules.`);
    } catch (err) {
      logger.error('[CronService] Trash purge failed:', err.message);
    }
  }
}

export default new CronService();
