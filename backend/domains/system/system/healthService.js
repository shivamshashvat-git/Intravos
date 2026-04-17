import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

/**
 * HealthService
 * Powers the 'Customer Health' score calculation.
 * Scores based on conversion, LTV, and recency.
 */
class HealthService {
  /**
   * Recalculates health scores for all customers in a tenant.
   * Called by cronService.runDailyMaintenance().
   */
  async updateCustomerHealth(tenantId) {
    try {
      const { data: customers, error } = await supabaseAdmin
        .from('customers')
        .select('id, created_at')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null);

      if (error) throw error;
      if (!customers || customers.length === 0) return [];

      const updates = [];

      for (const customer of customers) {
        // Get booking count and total revenue
        const { count: bookingCount } = await supabaseAdmin
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .is('deleted_at', null);

        const { data: payments } = await supabaseAdmin
          .from('payment_transactions')
          .select('amount')
          .eq('customer_id', customer.id)
          .is('deleted_at', null);

        const totalRevenue = (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // Simple health score: bookings * 20 + revenue factor + recency
        const daysSinceCreation = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / 86400000);
        const recencyBonus = daysSinceCreation < 90 ? 20 : daysSinceCreation < 180 ? 10 : 0;
        const score = Math.min(100, (bookingCount || 0) * 20 + Math.min(40, totalRevenue / 10000) + recencyBonus);

        await supabaseAdmin
          .from('customers')
          .update({ health_score: Math.round(score) })
          .eq('id', customer.id);

        updates.push(customer.id);
      }

      logger.info({ tenantId, count: updates.length }, '[HealthService] Updated customer health scores');
      return updates;
    } catch (err) {
      logger.error({ err: err.message, tenantId }, '[HealthService] Failed');
      return [];
    }
  }
}

export default new HealthService();
