import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';
import predictiveService from './predictiveService.js';

/**
 * AnalyticsService — Industrialized Business Intelligence
 * 
 * Centralizes complex aggregations, P&L reporting, and platform-wide growth stats.
 * Prefers Database Functions (RPCs) for performance and consistency.
 */
class AnalyticsService {
  async getSummary(tenantId, userRole, tenantCreatedAt, tenantPlan) {
    // If partner, return standard demo slice (This logic belongs in service)
    if (userRole === 'partner') {
      return {
        locked: true,
        is_demo: true,
        summary: {
          total_bookings: 142,
          total_revenue: 8450000,
          total_cost: 7120000,
          total_profit: 1330000,
          total_collected: 8200000,
          total_outstanding: 250000,
          profit_margin_pct: 15.7,
          bookings_breakdown: { booked: 12, completed: 130 }
        },
        meta: {
          days_active: 365,
          plan: 'pro',
          cta: {
            title: "Unlock Full Access",
            message: "Get real-time analytics and manage your own agency leads with Intravos Pro.",
            button_text: "Talk to Sales",
            action_url: "/support?subject=Upgrade%20to%20Pro"
          }
        }
      };
    }

    // Industrialized aggregation
    const { data: summary, error } = await supabaseAdmin
      .from('leads')
      .select('final_price, vendor_cost, profit, amount_collected, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .in('status', ['booked', 'completed']);

    if (error) throw error;

    const totalRevenue = summary.reduce((sum, l) => sum + (parseFloat(l.final_price) || 0), 0);
    const totalCost = summary.reduce((sum, l) => sum + (parseFloat(l.vendor_cost) || 0), 0);
    const totalProfit = summary.reduce((sum, l) => sum + (parseFloat(l.profit) || 0), 0);
    const totalCollected = summary.reduce((sum, l) => sum + (parseFloat(l.amount_collected) || 0), 0);

    const daysActive = Math.ceil((new Date() - new Date(tenantCreatedAt)) / (86400000));

    return {
      locked: false,
      summary: {
        total_bookings: summary.length,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_cost: parseFloat(totalCost.toFixed(2)),
        total_profit: parseFloat(totalProfit.toFixed(2)),
        total_collected: parseFloat(totalCollected.toFixed(2)),
        total_outstanding: parseFloat((totalRevenue - totalCollected).toFixed(2)),
        profit_margin_pct: totalRevenue > 0 ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0,
        bookings_breakdown: {
          booked: summary.filter(l => l.status === 'booked').length,
          completed: summary.filter(l => l.status === 'completed').length
        }
      },
      meta: {
        days_active: daysActive,
        plan: tenantPlan
      }
    };
  }

  async getMonthlyPnl(tenantId) {
    const { data, error } = await supabaseAdmin.rpc('rpc_get_monthly_pnl', { t_id: tenantId });
    if (error) throw error;
    return data || [];
  }

  async getPlatformStats() {
    const [
      { count: agencyCount },
      { data: totalVolume },
      { count: bookingCount }
    ] = await Promise.all([
      supabaseAdmin.from('tenants').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('invoices').select('total').is('deleted_at', null).not('status', 'eq', 'cancelled'),
      supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    ]);

    const volumeNum = (totalVolume || []).reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

    return {
      trusted_agencies: agencyCount || 0,
      itineraries_crafted: (bookingCount || 0) * 4,
      processed_volume: volumeNum,
      successful_trips: bookingCount || 0
    };
  }

  /**
   * Aggregate vendor financial performance and outstanding liabilities
   */
  async getVendorReconciliation(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('agents_directory')
      .select('id, name, agency_name, outstanding_payables, total_business_value, commission_earned, next_payment_due_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Orchestrate data extraction for various modules (CSV exports)
   */
  async getExportData(tenantId, module = 'customers') {
    const { data, error } = await supabaseAdmin
      .from(module)
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .limit(1000);

    if (error) throw error;
    if (!data?.length) throw new Error('No data to export');

    return data;
  }

  /**
   * Get Predictive Insights for a Tenant
   */
  async getPredictions(tenantId) {
    return await predictiveService.forecastRevenue(tenantId);
  }

  /**
   * Get Customer Segmentation based on lifetime value
   */
  async getCustomerSegments(tenantId) {
    return await predictiveService.segmentCustomers(tenantId);
  }
}

export default new AnalyticsService();
