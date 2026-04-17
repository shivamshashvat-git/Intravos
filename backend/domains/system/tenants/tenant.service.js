import { supabaseAdmin } from '../../../providers/database/supabase.js';
import slugify from 'slugify';

/**
 * TenantService — Industrialized Agency Governance & Subscription Orchestration
 */
class TenantService {
  /**
   * Fetch core agency attributes and deployment state
   */
  async getTenant(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Orchestrate agency update logic
   */
  async updateTenant(tenantId, updates) {
    const patch = { ...updates, updated_at: new Date().toISOString() };
    delete patch.id;
    delete patch.plan; // Plan changes happen via BillingService

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update(patch)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Agency not found');

    return data;
  }

  /**
   * Retrieve platform evolution history (Changelog)
   */
  async getChangelog(limit = 20) {
    const { data, error } = await supabaseAdmin
      .from('platform_changelog')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch cached operational insights for agency dashboard
   */
  async getDashboardStats(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('dashboard_stats_cache')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;
    return data || { message: 'Intelligence engine initializing...' };
  }

  /**
   * Provision a brand new agency entity
   * Industrialized: Now requires a mandatory promotional coupon
   */
  async provisionTenant(payload) {
    const { name, coupon_code } = payload;
    if (!name) throw new Error('Agency name is required');
    if (!coupon_code) throw new Error('A promotional coupon code is required for onboarding.');
    
    // 1. Validate the mandatory coupon (Centralized)
    const billing = new BillingService({ supabase: supabaseAdmin });
    const { coupon, updates: couponUpdates } = await billing.validateCoupon(coupon_code);

    let slug = slugify(name, { lower: true, strict: true });
    const { data: existing } = await supabaseAdmin.from('tenants').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug += `-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Determine initial plan and duration based on coupon
    const startingPlan = couponUpdates.plan || 'starter';
    const { data: planData } = await supabaseAdmin.from('plans').select('*').eq('slug', startingPlan).single();

    const tenantData = {
      name,
      slug,
      plan: startingPlan,
      max_seats: couponUpdates.max_seats || planData?.max_seats || 2,
      storage_limit_mb: couponUpdates.storage_limit_mb || planData?.storage_limit_mb || 2048,
      subscription_status: couponUpdates.subscription_status || 'trial',
      subscription_end_date: couponUpdates.subscription_end_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      trial_start: new Date().toISOString().split('T')[0],
      trial_end: couponUpdates.subscription_end_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      features_enabled: ["leads", "quotations", "bookings", "customers", "bot", "itineraries"],
      settings: {
        notifications: { email: true, whatsapp: false },
        branding: { primary_color: '#1A365D', secondary_color: '#2B6CB0' }
      }
    };

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (error) throw error;

    // 4. Provision Default Assets (Idempotent Check-then-Insert)
    const { data: existingPreset } = await supabaseAdmin
      .from('markup_presets')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('name', 'Standard 10% Markup')
      .maybeSingle();

    if (!existingPreset) {
      await supabaseAdmin.from('markup_presets').insert({
        tenant_id: tenant.id,
        name: 'Standard 10% Markup',
        calc_type: 'percentage',
        calc_value: 10,
        category: 'General',
        is_active: true
      });
    }

    // Increment coupon usage
    await supabaseAdmin.from('coupons').update({ times_used: (coupon.times_used || 0) + 1 }).eq('id', coupon.id);

    return tenant;
  }
}

export default new TenantService();
