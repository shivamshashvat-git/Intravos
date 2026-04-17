import BaseService from '../../../core/utils/BaseService.js';

/**
 * BillingService
 * 
 * The commercial brain of Intravos.
 * Handles:
 * - Plan & Feature entitlement (Purely data-driven)
 * - Usage & Quota enforcement (Seats, Storage)
 * - Trial management & Grace periods
 * - Coupon validation & application (including 365-day PRO bundles)
 */
export default class BillingService extends BaseService {
  
  /**
   * Enforce SaaS Quotas
   * Checks against tenant-specific overrides in the 'tenants' table.
   */
  async checkQuota(resourceType) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .select('max_seats, storage_limit_mb, storage_used_mb')
      .eq('id', this.tenantId)
      .single();

    if (error || !tenant) throw new Error('Tenant not found');

    if (resourceType === 'seats') {
      const { count, error: countErr } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.tenantId)
        .eq('is_active', true);

      if (countErr) throw countErr;
      if (count >= tenant.max_seats) {
        throw new Error(`Limit reached: Your current plan/override allows for ${tenant.max_seats} seats. Please contact support to increase your quota.`);
      }
    }

    if (resourceType === 'storage') {
      if (tenant.storage_used_mb >= tenant.storage_limit_mb) {
        throw new Error(`Storage limit reached (${tenant.storage_limit_mb}MB). Please delete old itineraries or contact support for an upgrade.`);
      }
    }

    return true;
  }

  /**
   * Internal Validation Logic
   */
  async validateCoupon(code) {
    const { data: coupon, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) throw new Error('Invalid or expired coupon code');
    
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      throw new Error('This coupon has reached its maximum usage limit');
    }

    let updates = {};
    if (coupon.code.startsWith('PRO365') || coupon.metadata?.bundle === 'pro_annual') {
      const { data: proPlan } = await this.supabase.from('plans').select('*').eq('slug', 'pro').single();
      updates = {
        plan: 'pro',
        max_seats: proPlan.max_seats,
        storage_limit_mb: proPlan.storage_limit_mb,
        subscription_status: 'active',
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return { coupon, updates };
  }

  /**
   * Apply a marketing coupon
   */
  async applyCoupon(code) {
    const { coupon, updates } = await this.validateCoupon(code);
    
    const { error: updateErr } = await this.supabase
      .from('tenants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', this.tenantId);

    if (updateErr) throw updateErr;

    // Increment coupon usage
    await this.supabase.from('coupons').update({ times_used: (coupon.times_used || 0) + 1 }).eq('id', coupon.id);
    
    await this.logActivity('tenant', this.tenantId, 'coupon_applied', { code, updates });
    return { success: true, plan: updates.plan || 'current' };
  }

  /**
   * Manual Lifecycle: Grant Grace Period
   */
  async grantGracePeriod(days = 7) {
    const graceDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await this.supabase
      .from('tenants')
      .update({ 
        grace_until: graceDate,
        subscription_status: 'grace',
        updated_at: new Date().toISOString()
      })
      .eq('id', this.tenantId);

    if (error) throw error;
    await this.logActivity('tenant', this.tenantId, 'grace_period_granted', { days, until: graceDate });
    return true;
  }

  /**
   * Manual Lifecycle: Offboarding
   */
  async offboardTenant() {
    const { error } = await this.supabase
      .from('tenants')
      .update({ 
        is_active: false,
        subscription_status: 'suspended',
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', this.tenantId);

    if (error) throw error;
    await this.logActivity('tenant', this.tenantId, 'tenant_offboarded');
    return true;
  }
}
