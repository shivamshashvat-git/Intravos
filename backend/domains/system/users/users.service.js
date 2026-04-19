import { supabaseAdmin } from '../../../providers/database/supabase.js';
import BaseService from '../../../core/utils/BaseService.js';
import logger from '../../../core/utils/logger.js';
import { logPlatformChange } from '../announcements/changelog.js';
import { getEffectiveFeatures } from '../../../core/middleware/featureFlag.js';
import BillingService from '../../finance/billing/billing.service.js';

/**
 * UsersService — Industrialized Identity, Team Management & Seat Governance
 */
class UsersService extends BaseService {
  /**
   * List staff directory with role-based field sanitization
   */
  async listUsers(actorRole, tenantId) {
    const adminRoles = ['admin', 'agency_admin', 'super_admin', 'platform_manager'];
    const fields = adminRoles.includes(actorRole)
      ? 'id, email, name, phone, role, designation, is_active, avatar_url, last_login_at, features_override, network_access, created_at'
      : 'id, email, name, phone, role, designation, is_active, avatar_url, last_login_at, created_at';

    let query = supabaseAdmin
      .from('users')
      .select(fields)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    // Filter platform-tier roles unless actor is platform-tier
    if (!['super_admin', 'platform_manager', 'ivobot'].includes(actorRole)) {
      query = query.not('role', 'in', '("super_admin","platform_manager","ivobot")');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Legacy alias for verify scripts
  async listTeam(tenantId) {
    return this.listUsers('agency_admin', tenantId);
  }

  /**
   * Fetch exhaustive profile with effective capability set
   */
  async getProfile(userId, tenantContext) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, role, designation, tips_seen, milestones, notif_prefs, features_override, network_access')
      .eq('id', userId)
      .single();

    if (error || !data) throw new Error('User not found');

    const effectiveFeatures = getEffectiveFeatures(
      { ...data, role: data.role },
      tenantContext
    );

    return {
      profile: data,
      effective_features: effectiveFeatures
    };
  }

  /**
   * Securely provision a new team member with entitlement enforcement
   */
  async provisionUser(actor, payload) {
    const { email, name, phone, role = 'staff', password, designation } = payload;
    if (!email || !name) throw new Error('email and name are required');

    // Role Elevation Protection
    if (['admin', 'agency_admin'].includes(actor.role) && role === 'super_admin') {
      throw new Error('Cannot assign super_admin role');
    }

    // 1. Seat Enforcement (Centralized)
    const billing = new BillingService({ user: { tenantId: actor.tenantId }, supabase: supabaseAdmin });
    await billing.checkQuota('seats');

    let userId = payload.id;
    let inviteLink = null;

    // 2. Identity Orchestration (Auth Service logic)
    if (!userId) {
      if (password) {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, phone: phone || null },
          app_metadata: { tenant_id: actor.tenantId, role }
        });
        if (authError) throw authError;
        userId = authUser.user.id;
      } else {
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { name, phone: phone || null },
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?type=invite`
        });
        if (inviteError) throw inviteError;
        userId = inviteData.user.id;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { tenant_id: actor.tenantId, role }
        });

        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email, data: { name } });
        inviteLink = linkData?.properties?.action_link;
      }
    }

    // 3. Database Sync - Use upsert to accommodate the on_auth_user_created trigger
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        auth_id: userId,
        tenant_id: actor.tenantId,
        email,
        name,
        phone: phone || null,
        role,
        designation: designation || null,
        features_override: role === 'staff' ? [] : null,
        network_access: ['admin', 'agency_admin'].includes(role)
      }, { onConflict: 'auth_id' })
      .select()
      .single();

    if (error) throw error;

    await logPlatformChange({
      tenant_id: actor.tenantId,
      user_id: actor.id,
      action: 'user_created',
      title: `User created: ${name}`,
      details: { created_user_id: data.id, role }
    });

    return { user: data, invite_link: inviteLink };
  }

  // Wrapper for legacy inviteUser call in controller/verify scripts
  async inviteUser(tenantId, actorId, payload) {
    return this.provisionUser({ tenantId, id: actorId, role: 'agency_admin' }, payload);
  }

  // Legacy alias for register/provision
  async createUser(tenantId, payload) {
    return (await this.provisionUser({ tenantId, role: 'agency_admin' }, payload)).user;
  }

  /**
   * Modify user attributes (Tiered Permissions check)
   */
  async updateUser(tenantId, targetUserId, patch, actor) {
    const { data: targetUser, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, role')
      .eq('id', targetUserId)
      .single();

    if (fetchErr) throw fetchErr;

    // Security Check: Same Tenant
    if (targetUser.tenant_id !== tenantId) {
      const err = new Error('Cross-tenant update prohibited');
      err.status = 403;
      throw err;
    }

    // Role Hierarchy Enforcement
    if (['admin', 'agency_admin'].includes(actor.role) && patch.role === 'super_admin') {
      throw new Error('Cannot assign super_admin role');
    }

    if (actor.role === 'secondary_admin') {
      const highRoles = ['agency_admin', 'secondary_admin', 'admin'];
      if (highRoles.includes(targetUser.role)) {
        const err = new Error('Insufficient permissions to modify an administrator');
        err.status = 403;
        throw err;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(patch)
      .eq('id', targetUserId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    await this.logActivity(tenantId, actor.id, 'user_updated', 'users', targetUserId, patch);
    return data;
  }

  // Legacy alias for auth tracking
  async update(userId, patch) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Deactivate User with Last Admin Preservation
   */
  async deactivateUser(tenantId, targetUserId, actorId) {
    const { data: targetUser, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, role')
      .eq('id', targetUserId)
      .single();

    if (fetchErr) throw fetchErr;
    if (targetUser.tenant_id !== tenantId) throw new Error('Forbidden');

    // Prevent deactivating the last Agency Admin
    if (['agency_admin', 'admin'].includes(targetUser.role)) {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('role', ['agency_admin', 'admin'])
        .eq('is_active', true)
        .is('deleted_at', null)
        .neq('id', targetUserId);

      if (count === 0) {
        const err = new Error('Cannot deactivate the last agency admin');
        err.status = 409;
        throw err;
      }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: actorId
      })
      .eq('id', targetUserId);

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'user_deactivated', 'users', targetUserId);
    return true;
  }

  async reactivateUser(tenantId, targetUserId, actorId) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: true,
        deleted_at: null,
        deleted_by: null
      })
      .eq('id', targetUserId);

    if (error) throw error;

    await this.logActivity(tenantId, actorId, 'user_reactivated', 'users', targetUserId);
    return true;
  }

  /**
   * Manage granular feature visibility overrides
   */
  async manageFeatures(actor, userId, features) {
    if (!['admin', 'agency_admin', 'super_admin'].includes(actor.role)) throw new Error('Admin permissions required');
    if (!Array.isArray(features)) throw new Error('features must be an array');

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ features_override: features, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('tenant_id', actor.tenantId)
      .select('id, name, features_override')
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return data;
  }

  /**
   * Orchestrate global B2B network visibility
   */
  async manageNetworkAccess(actor, userId, networkAccess) {
    if (!['admin', 'agency_admin', 'super_admin'].includes(actor.role)) throw new Error('Admin permissions required');
    if (typeof networkAccess !== 'boolean') throw new Error('network_access must be a boolean');

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ network_access: networkAccess, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('tenant_id', actor.tenantId)
      .select('id, name, network_access')
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return data;
  }

  async getMe(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        tenants (
          name, slug, plan, subscription_status, features_enabled
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Legacy alias for get profile
  async getById(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateMe(userId, data) {
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }
}

export default new UsersService();
