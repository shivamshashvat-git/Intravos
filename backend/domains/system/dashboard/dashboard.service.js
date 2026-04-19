import { supabaseAdmin } from '../../../providers/database/supabase.js';

class DashboardService {
  async getDashboardStats(tenantId) {
    const { data: cache, error } = await supabaseAdmin
      .from('dashboard_stats_cache')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;

    // If no cache exists, perform first-time refresh
    if (!cache) {
      return await this.refreshDashboardStats(tenantId);
    }

    // Check if cache is stale (> 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const updatedAt = new Date(cache.updated_at);

    if (updatedAt < thirtyMinsAgo) {
      // Trigger background refresh (fire and forget)
      this.refreshDashboardStats(tenantId).catch(err => {
        console.error(`Background refresh failed for tenant ${tenantId}:`, err);
      });
    }

    return cache;
  }

  async refreshDashboardStats(tenantId) {
    // 1. Leads Summary
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('status, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const leads_summary = {
      total: leads?.length || 0,
      new_this_month: leads?.filter(l => new Date(l.created_at) >= startOfMonth).length || 0,
      contacted: leads?.filter(l => l.status === 'contacted').length || 0,
      qualified: leads?.filter(l => l.status === 'qualified').length || 0,
      converted: leads?.filter(l => l.status === 'converted').length || 0,
      lost: leads?.filter(l => l.status === 'lost').length || 0,
      conversion_rate: leads?.length ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0
    };

    // 2. Customers Summary
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const customers_summary = {
      total: customers?.length || 0,
      active: customers?.length || 0, // Simplified for now
      new_this_month: customers?.filter(c => new Date(c.created_at) >= startOfMonth).length || 0,
      avg_health_score: 85, // Placeholder for health score logic
      birthdays_this_week: 0,
      dormant_count: 0
    };

    // 3. Bookings Summary
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('status, booking_number, total_amount, travel_start_date')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const bookings_summary = {
      total: bookings?.length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      in_progress: bookings?.filter(b => b.status === 'in_progress').length || 0,
      completed_this_month: 0, // Add logic for completed status + date
      upcoming_departures_7d: bookings?.filter(b => {
        const start = new Date(b.travel_start_date);
        const diff = (start - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }).length || 0,
      total_revenue_mtd: bookings?.filter(b => b.status !== 'cancelled').reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0)
    };

    // 4. Finance Summary
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, balance_amount, status, due_date')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const finance_summary = {
      total_invoiced_mtd: invoices?.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0) || 0,
      total_collected_mtd: invoices?.reduce((acc, i) => acc + (Number(i.total_amount) - Number(i.balance_amount) || 0), 0) || 0,
      outstanding_balance: invoices?.reduce((acc, i) => acc + (Number(i.balance_amount) || 0), 0) || 0,
      total_expenses_mtd: 0,
      net_pnl_mtd: 0,
      overdue_invoices_count: invoices?.filter(i => i.status === 'overdue' || (new Date(i.due_date) < now && i.balance_amount > 0)).length || 0
    };

    // 5. Tasks Summary
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('status, due_date, is_done, completed_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const tasks_summary = {
      total_open: tasks?.filter(t => !t.is_done).length || 0,
       overdue: tasks?.filter(t => !t.is_done && t.due_date && new Date(t.due_date) < now).length || 0,
      due_today: tasks?.filter(t => !t.is_done && t.due_date && new Date(t.due_date).toDateString() === now.toDateString()).length || 0,
      completed_today: tasks?.filter(t => t.is_done && t.completed_at && new Date(t.completed_at).toDateString() === now.toDateString()).length || 0,
      completion_rate_7d: 0 // Placeholder
    };

    // 6. Visa Summary
    const { data: visas } = await supabaseAdmin
      .from('visa_tracking')
      .select('status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const visa_summary = {
      total_active: visas?.filter(v => v.status === 'in_progress').length || 0,
      approved_this_month: visas?.filter(v => v.status === 'approved').length || 0,
      pending_count: visas?.filter(v => v.status === 'pending_submission').length || 0,
      rejection_rate: 0,
      alerts_count: 0
    };

    const dashboardRow = {
      tenant_id: tenantId,
      leads_summary,
      customers_summary,
      bookings_summary,
      finance_summary,
      tasks_summary,
      visa_summary,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('dashboard_stats_cache')
      .upsert(dashboardRow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPerformanceMetrics(tenantId, period = '30d') {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Daily Leads
      const { data: leads } = await supabaseAdmin
          .from('leads')
          .select('created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString())
          .is('deleted_at', null);

      // Daily Bookings & Revenue
      const { data: bookings } = await supabaseAdmin
          .from('bookings')
          .select('created_at, total_amount, status')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString())
          .is('deleted_at', null);

      // Grouping logic (simplified)
      const metrics = {
          daily_leads_created: [],
          daily_bookings_confirmed: [],
          daily_revenue: []
      };

      for (let i = 0; i < days; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];

          metrics.daily_leads_created.push({
              date: dateStr,
              count: leads?.filter(l => l.created_at.startsWith(dateStr)).length || 0
          });
          metrics.daily_bookings_confirmed.push({
              date: dateStr,
              count: bookings?.filter(b => b.created_at.startsWith(dateStr) && b.status === 'confirmed').length || 0
          });
          metrics.daily_revenue.push({
              date: dateStr,
              amount: bookings?.filter(b => b.created_at.startsWith(dateStr) && b.status !== 'cancelled').reduce((s, b) => s + (Number(b.total_amount) || 0), 0) || 0
          });
      }

      return metrics;
  }

  async getTopPerformers(tenantId, period = '30d') {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: performers, error } = await supabaseAdmin.rpc('get_top_performers', {
          p_tenant_id: tenantId,
          p_start_date: startDate.toISOString()
      });

      // If RPC is missing, we perform a manual join aggregation (slower but safe fallback if user hasn't run RPC SQL yet)
      if (error) {
           const { data: users } = await supabaseAdmin.from('users').select('id, name').eq('tenant_id', tenantId);
           const { data: bookings } = await supabaseAdmin.from('bookings')
              .select('assigned_to, total_amount, status')
              .eq('tenant_id', tenantId)
              .gte('created_at', startDate.toISOString())
              .is('deleted_at', null);

           const result = users.map(u => {
              const userBookings = bookings?.filter(b => b.assigned_to === u.id) || [];
              return {
                  user_id: u.id,
                  name: u.name,
                  bookings_confirmed: userBookings.filter(b => b.status === 'confirmed').length,
                  revenue_generated: userBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (Number(b.total_amount) || 0), 0),
                  leads_created: 0,
                  tasks_completed: 0
              };
           }).sort((a,b) => b.revenue_generated - a.revenue_generated);

           return result;
      }

      return performers;
  }
}

export default new DashboardService();
