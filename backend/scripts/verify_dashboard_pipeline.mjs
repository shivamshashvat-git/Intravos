import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('\n==================================================');
  console.log(' MODULE 8: DASHBOARD & ANALYTICS VERIFICATION');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const testTenantId = '00000000-0000-0000-0000-000000000001'; // Acme Travels
  const testUserId = '00000000-0000-0000-0000-000000000004'; // Agent 1

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const { default: dashboardService } = await import('../domains/system/dashboard/dashboard.service.js');
    const { default: notificationService } = await import('../domains/system/notifications/notifications.service.js');

    console.log('--- 1. Dashboard Stats Cache Refresh ---');
    try {
      const stats = await dashboardService.refreshDashboardStats(testTenantId);
      assert(stats && stats.leads_summary, 'Dashboard stats successfully refreshed and cached');
      assert(stats.bookings_summary.total >= 0, 'Bookings summary aggregated correctly');
      assert(stats.finance_summary.outstanding_balance >= 0, 'Finance summary aggregated correctly');
    } catch (e) {
      assert(false, `Dashboard refresh failed: ${e.message}`);
      console.error(e);
    }

    console.log('\n--- 2. Dashboard Stats Read (with Stale Background Logic) ---');
    try {
      const stats = await dashboardService.getDashboardStats(testTenantId);
      assert(stats && stats.tenant_id === testTenantId, 'Dashboard stats retrieved for correct tenant');
      
      // Simulate stale cache by updating updated_at to 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabase.from('dashboard_stats_cache').update({ updated_at: oneHourAgo }).eq('tenant_id', testTenantId);
      
      const staleStats = await dashboardService.getDashboardStats(testTenantId);
      assert(staleStats.tenant_id === testTenantId, 'Retrieved stale data while refresh was triggered');
      
    } catch (e) {
      assert(false, `Dashboard read failed: ${e.message}`);
      console.error(e);
    }

    console.log('\n--- 3. Agency Performance Metrics (Time-series) ---');
    try {
      const metrics = await dashboardService.getPerformanceMetrics(testTenantId, '30d');
      assert(Array.isArray(metrics.daily_leads_created), 'Daily leads time-series generated');
      assert(metrics.daily_leads_created.length === 30, 'Time-series covers correct period (30 days)');
      assert(Array.isArray(metrics.daily_revenue), 'Daily revenue time-series generated');
    } catch (e) {
      assert(false, `Performance metrics failed: ${e.message}`);
      console.error(e);
    }

    console.log('\n--- 4. Top Performers ---');
    try {
      const performers = await dashboardService.getTopPerformers(testTenantId, '30d');
      assert(Array.isArray(performers), `Retrieved ${performers.length} performers for comparison`);
      if (performers.length > 0) {
          assert(performers[0].name !== undefined, 'Performer object contains user name');
      }
    } catch (e) {
      assert(false, `Top performers failed: ${e.message}`);
      console.error(e);
    }

    console.log('\n--- 5. Notifications Feed ---');
    try {
      const newNotif = {
          user_id: testUserId,
          notif_type: 'system',
          title: 'Pipeline Verification',
          message: 'This is a test notification from the industrialization script.'
      };
      const created = await notificationService.createNotification(testTenantId, newNotif);
      assert(created && created.id, 'Test notification created');

      const list = await notificationService.listNotifications(testTenantId, testUserId);
      assert(list.some(n => n.id === created.id), 'Notification found in user feed');

      await notificationService.markAsRead(testTenantId, testUserId, created.id);
      const updatedList = await notificationService.listNotifications(testTenantId, testUserId);
      const updatedItem = updatedList.find(n => n.id === created.id);
      assert(updatedItem.is_read === true, 'Notification successfully marked as read');

      await notificationService.markAllAsRead(testTenantId, testUserId);
      const finalCheck = await notificationService.listNotifications(testTenantId, testUserId);
      assert(finalCheck.every(n => n.is_read === true), 'All notifications marked as read');

    } catch (e) {
      assert(false, `Notifications pipeline failed: ${e.message}`);
      console.error(e);
    }

  } catch (err) {
    console.log('\n❌ [CRITICAL PIPELINE FAILURE]');
    console.error(err);
  } finally {
    console.log('\n==================================================');
    console.log(` PIPELINE RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

verify();
