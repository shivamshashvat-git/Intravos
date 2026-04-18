import { supabase } from '@/core/lib/supabase';
import { DashboardData } from '@/features/dashboard/types/dashboard';

export const dashboardService = {
  async getDashboardData(tenantId: string, userId: string): Promise<DashboardData> {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString();

    const [
      leadsRes,
      followupsRes,
      revenueRes,
      overdueInvRes,
      bookingsRes,
      tasksRes,
      visaRes,
      recentLeadsRes,
      upcomingDepRes,
      trendRes
    ] = await Promise.all([
      // Query A: Leads
      supabase.from('leads').select('status, created_at, updated_at').eq('tenant_id', tenantId).is('deleted_at', null),
      // Query B: Follow-ups
      supabase.from('lead_followups').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('is_done', false).lt('due_date', new Date().toISOString()).is('deleted_at', null),
      // Query C: Revenue
      supabase.from('invoices').select('total, amount_paid, status, created_at').eq('tenant_id', tenantId).is('deleted_at', null).gte('created_at', firstOfMonth),
      // Query D: Overdue Invoices
      supabase.from('invoices').select('total, amount_paid').eq('tenant_id', tenantId).is('deleted_at', null).lt('due_date', today).not('status', 'in', '("paid","cancelled")'),
      // Query E: Bookings
      supabase.from('bookings').select('status, travel_start_date, travel_end_date').eq('tenant_id', tenantId).is('deleted_at', null),
      // Query F: Tasks
      supabase.from('tasks').select('due_date, is_done').eq('tenant_id', tenantId).eq('assigned_to', userId).is('deleted_at', null),
      // Query G: Visa Alerts
      supabase.from('visa_tracking').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('passport_holder', 'agency').not('status', 'in', '("approved","rejected")').is('deleted_at', null),
      // Query H: Recent Leads
      supabase.from('leads').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }).limit(8),
      // Query I: Upcoming Departures
      supabase.from('bookings').select('*').eq('tenant_id', tenantId).is('deleted_at', null).gte('travel_start_date', today).lte('travel_start_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]).in('status', ['confirmed', 'in_progress']).order('travel_start_date', { ascending: true }).limit(5),
      // Query J: Revenue Trend
      supabase.from('payment_transactions').select('amount, payment_date').eq('tenant_id', tenantId).is('deleted_at', null).gte('payment_date', sixMonthsAgo)
    ]);

    // Computation
    const leads = leadsRes.data || [];
    const statusCounts: Record<string, number> = {};
    leads.forEach(l => statusCounts[l.status] = (statusCounts[l.status] || 0) + 1);

    const activeLeads = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;
    const leadsToday = leads.filter(l => l.created_at?.split('T')[0] === today).length;
    const convertedThisMonth = leads.filter(l => l.status === 'converted' && l.updated_at >= firstOfMonth).length;

    const invoices = revenueRes.data || [];
    const invoicedThisMonth = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const collectedThisMonth = invoices.reduce((sum, i) => sum + Number(i.amount_paid), 0);
    const outstanding = invoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.amount_paid)), 0);

    const overdueInvoices = overdueInvRes.data || [];
    const overdueAmt = overdueInvoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.amount_paid)), 0);

    const bookings = bookingsRes.data || [];
    const tasks = tasksRes.data || [];

    // Trend grouping
    const trendData: Record<string, number> = {};
    (trendRes.data || []).forEach(t => {
       const month = new Date(t.payment_date).toLocaleString('default', { month: 'short' });
       trendData[month] = (trendData[month] || 0) + Number(t.amount);
    });
    const months = [];
    for(let i=5; i>=0; i--) {
       const d = new Date();
       d.setMonth(d.getMonth() - i);
       months.push(d.toLocaleString('default', { month: 'short' }));
    }
    const finalTrend = months.map(m => ({ month: m, collected: trendData[m] || 0 }));

    return {
      leads: {
        active_leads: activeLeads,
        leads_today: leadsToday,
        leads_this_month: leads.length,
        converted_this_month: convertedThisMonth,
        status_counts: statusCounts
      },
      followups: { overdue_followups: followupsRes.count || 0 },
      revenue: {
        invoiced_this_month: invoicedThisMonth,
        collected_this_month: collectedThisMonth,
        outstanding: outstanding
      },
      overdueInvoices: {
        overdue_invoices: overdueInvoices.length,
        overdue_amount: overdueAmt
      },
      bookings: {
        confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
        active_bookings: bookings.filter(b => b.status === 'in_progress').length,
        departures_today: bookings.filter(b => b.travel_start_date === today).length,
        returns_today: bookings.filter(b => b.travel_end_date === today).length
      },
      myTasks: {
        my_tasks_today: tasks.filter(t => !t.is_done && t.due_date?.split('T')[0] === today).length,
        my_overdue_tasks: tasks.filter(t => !t.is_done && t.due_date && new Date(t.due_date) < new Date() && t.due_date.split('T')[0] !== today).length
      },
      visaAlerts: { passports_at_agency: visaRes.count || 0 },
      recentLeads: recentLeadsRes.data || [],
      upcomingDepartures: upcomingDepRes.data || [],
      revenueTrend: finalTrend
    };
  },

  async writeCacheUpdate(tenantId: string, stats: any) {
    try {
      await supabase.from('dashboard_stats_cache').upsert({
        tenant_id: tenantId,
        active_leads_count: stats.leads.active_leads,
        leads_today_count: stats.leads.leads_today,
        tasks_due_today_count: stats.myTasks.my_tasks_today,
        active_bookings_count: stats.bookings.active_bookings,
        revenue_this_month: stats.revenue.invoiced_this_month,
        collected_this_month: stats.revenue.collected_this_month,
        outstanding_amount: stats.revenue.outstanding,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Cache sync failed', e);
    }
  }
};
