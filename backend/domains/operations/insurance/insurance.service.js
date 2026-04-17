import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * InsuranceService — Specialized Travel Risk Governance
 */
class InsuranceService {
  /**
   * List active or expiring policies
   */
  async listPolicies(tenantId, filters) {
    const { customer_id, booking_id, claim_status, expiring_within_days } = filters;
    
    let query = supabaseAdmin
      .from('travel_insurance_policies')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('end_date', { ascending: true });

    if (customer_id) query = query.eq('customer_id', customer_id);
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (claim_status) query = query.eq('claim_status', claim_status);
    
    if (expiring_within_days) {
      const until = new Date(Date.now() + parseInt(expiring_within_days, 10) * 86400000).toISOString().split('T')[0];
      query = query.lte('end_date', until);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { policies: data || [], total: count || 0 };
  }

  /**
   * Register a new travel protection policy
   */
  async recordPolicy(tenantId, userId, payload) {
    if (!payload.customer_id || !payload.provider || !payload.policy_number || !payload.start_date || !payload.end_date) {
      throw new Error('customer_id, provider, policy_number, start_date, and end_date are required');
    }

    const { data, error } = await supabaseAdmin
      .from('travel_insurance_policies')
      .insert({
        ...payload,
        tenant_id: tenantId,
        coverage_type: payload.coverage_type || 'basic',
        claim_status: payload.claim_status || 'none',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Correct or extend policy details
   */
  async updatePolicy(tenantId, policyId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('travel_insurance_policies')
      .update(updates)
      .eq('id', policyId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retire policy record
   */
  async deletePolicy(tenantId, userId, policyId) {
    return await softDeleteDirect({
      table: 'travel_insurance_policies',
      id: policyId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Travel insurance policy',
      select: 'id, policy_number, deleted_at'
    });
  }
}

export default new InsuranceService();
