import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * ReferralService — Growth & Partnership Coordination
 */
class ReferralService {
  /**
   * Get exhaustive referral state for a tenant
   */
  async getReferralState(tenantId) {
    // 1. Get referral code and payout details from tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .select('referral_code, payout_bank_details')
      .eq('id', tenantId)
      .single();

    if (tenantErr) throw tenantErr;

    // 2. Get list of referred agencies with referee details
    const { data: referrals, error: refErr } = await supabaseAdmin
      .from('referrals')
      .select(`
        *,
        referee:referee_tenant_id (
          id,
          name
        )
      `)
      .eq('referrer_tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (refErr) throw refErr;

    return {
      referral_code: tenant.referral_code,
      payout_bank_details: tenant.payout_bank_details,
      referrals: referrals || []
    };
  }

  /**
   * Update growth payout coordinates
   */
  async updatePayoutDetails(tenantId, payoutDetails) {
    if (!payoutDetails) throw new Error('payout_bank_details required');

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({ payout_bank_details: payoutDetails })
      .eq('id', tenantId)
      .select('payout_bank_details')
      .single();

    if (error) throw error;
    return data.payout_bank_details;
  }
}

export default new ReferralService();
