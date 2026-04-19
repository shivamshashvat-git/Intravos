import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { logPlatformChange } from '../announcements/changelog.js';
import { refreshClientHealth } from '../../crm/analytics/clientHealth.js';

/**
 * AdminService — Platform Governance & Super Admin Cockpit
 */
class AdminService {
  
  // ── TENANT MANAGEMENT ──

  async getTenantsOverview() {
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, plan, subscription_status, is_active, is_free, current_health_score, grace_until, deactivated_at, created_at, users:users(count)');

    if (error) throw error;

    const overview = {
      total: tenants.length,
      active: tenants.filter(t => t.subscription_status === 'active').length,
      trial: tenants.filter(t => t.subscription_status === 'trial').length,
      grace: tenants.filter(t => t.subscription_status === 'grace').length,
      limited: tenants.filter(t => t.subscription_status === 'limited').length,
      suspended: tenants.filter(t => t.subscription_status === 'suspended').length,
      free: tenants.filter(t => t.is_free === true).length,
      inactive: tenants.filter(t => t.is_active === false).length,
    };

    return { overview, tenants, total_tenants: tenants.length };
  }

  async getExpiringTenants() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, plan, subscription_status, subscription_end_date, annual_price, is_early_client')
      .eq('subscription_status', 'active')
      .gte('subscription_end_date', now.toISOString())
      .lte('subscription_end_date', in7Days.toISOString())
      .order('subscription_end_date', { ascending: true });

    if (error) throw error;

    return data.map(t => ({
      ...t,
      days_until_expiry: Math.ceil((new Date(t.subscription_end_date) - now) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getAtRiskTenants() {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, plan, subscription_status, subscription_end_date, grace_until, limited_until, annual_price, is_early_client')
      .in('subscription_status', ['grace', 'limited'])
      .order('subscription_status', { ascending: true })
      .order('subscription_end_date', { ascending: true });

    if (error) throw error;

    const now = new Date();
    return data.map(t => {
      const deadlineField = t.subscription_status === 'grace' ? t.grace_until : t.limited_until;
      return {
        ...t,
        days_until_suspended: deadlineField
          ? Math.ceil((new Date(deadlineField) - now) / (1000 * 60 * 60 * 24))
          : null,
      };
    });
  }

  // ── PLATFORM COMMUNICATION ──

  async getChangelog(filters) {
    const { tenant_id, action, limit = 100 } = filters;
    let query = supabaseAdmin
      .from('platform_changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (action) query = query.eq('action', action);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAnnouncements() {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAnnouncement(userId, payload) {
    const annPayload = {
      ...payload,
      announcement_type: payload.announcement_type || 'feature',
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_by: userId,
    };

    if (!annPayload.title || !annPayload.message) {
      throw new Error('title and message are required');
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert(annPayload)
      .select()
      .single();

    if (error) throw error;

    await logPlatformChange({
      tenant_id: null,
      user_id: userId,
      action: 'announcement_created',
      title: `Announcement created: ${annPayload.title}`,
      details: annPayload,
    });

    return data;
  }

  async updateAnnouncement(annId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.created_by;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updates)
      .eq('id', annId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async retireAnnouncement(annId) {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update({ is_active: false, ends_at: new Date().toISOString() })
      .eq('id', annId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── REVENUE & PAYMENTS ──

  async getRevenueDashboard() {
    const [{ data: payments }, { data: tenants }] = await Promise.all([
      supabaseAdmin.from('platform_payments').select('amount, payment_date, payment_type'),
      supabaseAdmin.from('tenants').select('annual_price, subscription_end_date').eq('subscription_status', 'active')
    ]);

    const historicalCash = (payments || []).reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const now = new Date();
    let totalArr = 0, projected30Days = 0, projected90Days = 0;

    (tenants || []).forEach(t => {
      const price = parseFloat(t.annual_price || 0);
      totalArr += price;
      if (t.subscription_end_date) {
        const endDate = new Date(t.subscription_end_date);
        const days = (endDate - now) / (1000 * 60 * 60 * 24);
        if (days > 0 && days <= 30) projected30Days += price;
        else if (days > 30 && days <= 90) projected90Days += price;
      }
    });

    return { historical_cash: historicalCash, projected_arr: totalArr, upcoming_renewals_30d_cash: projected30Days, upcoming_renewals_90d_cash: projected90Days };
  }

  async getPlatformPayments(tenantId) {
    let query = supabaseAdmin.from('platform_payments').select('*').order('payment_date', { ascending: false });
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ── IMPERSONATION ──

  async startImpersonation(actor, payload) {
    const { tenant_id, user_id, reason, is_edit_mode = false } = payload;
    if (!tenant_id && !user_id) throw new Error('tenant_id or user_id is required');

    let targetQuery = supabaseAdmin.from('users').select('id, tenant_id, email, name, role, is_active, created_at').eq('is_active', true);
    if (user_id) targetQuery = targetQuery.eq('id', user_id);
    else targetQuery = targetQuery.eq('tenant_id', tenant_id).eq('role', 'agency_admin').order('created_at', { ascending: true }).limit(1);

    const targetResponse = user_id ? await targetQuery.single() : await targetQuery;
    const targetUser = user_id ? targetResponse.data : targetResponse.data?.[0];
    if (targetResponse.error || !targetUser) throw new Error('Target user not found');

    const { data: tenant } = await supabaseAdmin.from('tenants').select('id, name, slug').eq('id', targetUser.tenant_id).single();

    const { data: session, error } = await supabaseAdmin
      .from('impersonation_sessions')
      .insert({
        super_admin_user_id: actor.id,
        target_user_id: targetUser.id,
        target_tenant_id: targetUser.tenant_id,
        reason: reason || null,
        metadata: { actor_email: actor.email, target_email: targetUser.email, target_role: targetUser.role, tenant_name: tenant.name, is_edit_mode },
      })
      .select().single();

    if (error) throw error;

    return {
      session,
      action_label: `Impersonating ${targetUser.name || targetUser.email} in ${tenant.name}`,
      impersonation_token: session.session_token,
      target_user: targetUser,
      target_tenant: tenant
    };
  }

  async endImpersonation(actorId, token) {
    if (!token) throw new Error('session_token is required');
    const { data: session, error } = await supabaseAdmin
      .from('impersonation_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('session_token', token)
      .eq('super_admin_user_id', actorId)
      .select().single();

    if (error) throw error;
    return session;
  }

  // ── SUPPORT & HEALTH ──

  async getClientHealth() {
    const { data: tenants } = await supabaseAdmin.from('tenants').select('id, name, slug').order('name');
    const items = [];
    for (const tenant of tenants || []) {
      const health = await refreshClientHealth(tenant.id);
      items.push({ ...health, tenant_name: tenant.name, tenant_slug: tenant.slug });
    }
    return items;
  }

  async getSupportTickets(filters) {
    const { status = 'all', ticket_type = 'support' } = filters;
    let query = supabaseAdmin.from('support_tickets').select('*, tenants(name)').eq('ticket_type', ticket_type).is('deleted_at', null).order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ── OPERATIONS (COUPONS & SALES) ──

  async getUpgradeRequests() {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('ticket_type', 'feature_request')
      .is('deleted_at', null)
      .ilike('subject', 'Upgrade Request:%')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCoupons() {
    const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createCoupon(userId, payload) {
    const couponPayload = {
      ...payload,
      code: String(payload.code).trim().toUpperCase(),
      coupon_type: payload.coupon_type || 'trial',
      created_by: userId,
    };
    const { data, error } = await supabaseAdmin.from('coupons').insert(couponPayload).select('*').single();
    if (error) throw error;
    return data;
  }

  async updateCoupon(couponId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.created_by;
    if (updates.code) updates.code = String(updates.code).trim().toUpperCase();
    const { data, error } = await supabaseAdmin.from('coupons').update(updates).eq('id', couponId).select('*').single();
    if (error) throw error;
    return data;
  }

  async getCouponUsage(couponId) {
    const { data, error } = await supabaseAdmin.from('coupon_usage_logs').select('*').eq('coupon_id', couponId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getSalesRequests(filters) {
    const { status = 'all', urgency = 'all' } = filters;
    let query = supabaseAdmin.from('sales_requests').select('*').order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    if (urgency !== 'all') query = query.eq('urgency', urgency);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateSalesRequest(requestId, payload) {
    const updates = { ...payload, updated_at: new Date().toISOString() };
    if (payload.status === 'contacted' && !updates.contacted_at) updates.contacted_at = new Date().toISOString();
    if (['closed_won', 'closed_lost'].includes(payload.status)) updates.closed_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('sales_requests').update(updates).eq('id', requestId).select('*').single();
    if (error) throw error;
    return data;
  }

  // ── SETTINGS & CRM ──

  async getPlatformSettings() {
    const { data, error } = await supabaseAdmin.from('platform_settings').select('settings').eq('id', 'global').single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.settings || {};
  }

  async updatePlatformSettings(userId, settings) {
    const { data: current } = await supabaseAdmin.from('platform_settings').select('settings').eq('id', 'global').single();
    const merged = { ...(current?.settings || {}), ...settings };
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ id: 'global', settings: merged, updated_at: new Date().toISOString(), updated_by: userId })
      .select('settings').single();
    if (error) throw error;
    await logPlatformChange({ tenant_id: null, user_id: userId, action: 'global_settings_updated', title: 'Global platform settings updated', details: settings });
    return data.settings;
  }

  async getProspects(status = 'all') {
    let query = supabaseAdmin.from('platform_prospects').select('*').order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createProspect(payload) {
    const { name, email, phone } = payload;
    if (!name) throw new Error('name is required');
    // Dupe checks
    if (email) {
      const { data: ex } = await supabaseAdmin.from('platform_prospects').select('id, name').eq('email', email).maybeSingle();
      if (ex) throw new Error(`Prospect already exists as ${ex.name}`);
    }
    const { data, error } = await supabaseAdmin.from('platform_prospects').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  // ── PLATFORM BILLING ──

  async getPlatformInvoices(filters) {
    const { tenant_id, status = 'all' } = filters;
    let query = supabaseAdmin.from('platform_invoices').select('*, tenants(name)').order('created_at', { ascending: false });
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async generatePlatformInvoice(userId, payload) {
    let { tenant_id, base_amount, due_date, notes } = payload;
    if (!tenant_id || !base_amount) throw new Error('tenant_id and base_amount are required');

    const tax = parseFloat(base_amount) * 0.18;
    const total = parseFloat(base_amount) + tax;
    const invoice_number = `INTV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabaseAdmin
      .from('platform_invoices')
      .insert({ tenant_id, invoice_number, base_amount, tax_amount: tax, total_amount: total, due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), notes, status: 'sent' })
      .select().single();

    if (error) throw error;
    await logPlatformChange({ tenant_id: null, user_id: userId, action: 'platform_invoice_generated', title: `Invoice ${invoice_number} generated`, details: data });
    return data;
  }

  async recordPlatformInvoicePayment(payload) {
    const { invoice_id, payment_method, transaction_ref } = payload;
    if (!invoice_id) throw new Error('invoice_id is required');
    const { data: inv } = await supabaseAdmin.from('platform_invoices').select('*').eq('id', invoice_id).single();
    if (!inv) throw new Error('Invoice not found');

    await supabaseAdmin.from('platform_invoices').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', invoice_id);
    await supabaseAdmin.from('platform_payments').insert({ tenant_id: inv.tenant_id, amount: inv.total_amount, payment_type: 'renewal', payment_method: payment_method || 'NEFT', transaction_ref, notes: `Payment for invoice ${inv.invoice_number}` });

    return { success: true };
  }

  /**
   * Manual Lifecycle: Grant Grace Period
   */
  async grantGracePeriod(tenantId, days = 7) {
    const graceDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({ 
        grace_until: graceDate,
        subscription_status: 'grace',
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)
      .select().single();

    if (error) throw error;
    return data;
  }

  /**
   * Manual Lifecycle: Deactivate Agency (Offboarding)
   * Industrial 90-day retention policy applied via middleware
   */
  async deactivateTenant(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({ 
        is_active: false,
        subscription_status: 'suspended',
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)
      .select().single();

    if (error) throw error;
    return data;
  }

  /**
   * Referral Governance: Update Internal Notes
   */
  async updateReferralNotes(referralId, notes) {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', referralId)
      .select().single();

    if (error) throw error;
    return data;
  }

  async getImpersonationSessions(filters) {
    const { status = 'active' } = filters;
    const { data, error } = await supabaseAdmin
      .from('impersonation_sessions')
      .select('*')
      .eq('status', status)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update prospect profile
   */
  async updateProspect(prospectId, payload) {
    const { data, error } = await supabaseAdmin
      .from('platform_prospects')
      .update(payload)
      .eq('id', prospectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * List all network staff members
   */
  async getStaffMembers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, tenant_id, tenants(name)')
      .eq('role', 'staff');

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark referral incentive as fulfilled
   */
  async fulfillReferral(referralId) {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', referralId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * List platform referrals
   */
  async listReferrals() {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select('*, referer:tenants!referrals_referrer_tenant_id_fkey(name, slug), referee:tenants!referrals_referee_tenant_id_fkey(name, slug, created_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default new AdminService();
