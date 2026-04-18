import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * PredictiveService — Proprietary Business Intelligence Engine
 * 
 * Instead of generic Generative AI, Intravos uses statistical modeling 
 * to provide high-value business insights (Lead Scoring, Revenue Forecasting).
 */
class PredictiveService {
  /**
   * Calculate a Lead's priority score (0-100)
   * Factors: Budget, Days in Pipeline, Last Interaction, Current Status
   */
  calculateLeadScore(lead) {
    let score = 50; // Baseline

    // 1. Budget weight (Assume average travel spend is $2000 per person)
    const budgetVal = parseFloat(lead.budget) || 0;
    if (budgetVal > 10000) score += 20;
    else if (budgetVal > 5000) score += 10;
    else if (budgetVal > 0 && budgetVal < 2000) score -= 10;

    // 2. Recency (Days since last update)
    const lastUpdate = new Date(lead.updated_at || lead.created_at);
    const daysSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 2) score += 15; // Fresh lead
    else if (daysSinceUpdate > 14) score -= 20; // Stale lead

    // 3. Status progression
    const statusWeights = {
      'new': 0,
      'in_progress': 10,
      'quotation_sent': 25,
      'booked': 40,
      'completed': 0, // Transaction finished
      'lost': -50
    };
    score += (statusWeights[lead.status] || 0);

    // 4. Cap score between 0 and 100
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Forecast Revenue for a Tenant
   * Logic: (Booked Revenue) + (Pipeline Revenue * Conversion Probability)
   */
  async forecastRevenue(tenantId) {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('selling_price, status, budget')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'eq', 'lost');

    if (error) throw error;

    let confirmedRevenue = 0;
    let projection = 0;

    leads.forEach(lead => {
      const price = parseFloat(lead.selling_price) || parseFloat(lead.budget) || 0;
      
      if (lead.status === 'booked') {
        confirmedRevenue += price;
      } else {
        // Probability discovery based on status
        const probabilityMap = {
          'new': 0.1,
          'in_progress': 0.25,
          'quotation_sent': 0.6
        };
        projection += price * (probabilityMap[lead.status] || 0);
      }
    });

    return {
      confirmed: parseFloat(confirmedRevenue.toFixed(2)),
      projected_additional: parseFloat(projection.toFixed(2)),
      total_forecast: parseFloat((confirmedRevenue + projection).toFixed(2))
    };
  }

  /**
   * Segment Customers (RFM Analysis Lite)
   * R: Recency (Days since last booking)
   * F: Frequency (Number of bookings)
   * M: Monetary (Total Spend)
   */
  async segmentCustomers(tenantId) {
    const { data: segments, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, total_spent, last_booking_at, bookings_count')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;

    return segments.map(c => {
      let tier = 'Standard';
      if (c.total_spent > 50000 || c.bookings_count > 10) tier = 'Platinum (Whale)';
      else if (c.total_spent > 15000) tier = 'Gold';
      else if (c.bookings_count > 3) tier = 'Frequent Flyer';

      return {
        ...c,
        tier
      };
    });
  }
}

export default new PredictiveService();
