import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { logPlatformChange } from '../announcements/changelog.js';
import { getEffectiveFeatures } from '../../../core/middleware/featureFlag.js';

/**
 * UserService — Industrialized Identity & Seat Governance
 */
class UserService {
  /**
   * List staff directory with role-based field sanitization
   */
  async listUsers(actorRole, tenantId) {
    const fields = actorRole === 'admin' || actorRole === 'super_admin'
      ? 'id, email, name, phone, role, designation, is_active, avatar_url, last_login_at, features_override, network_access, created_at'
      : 'id, email, name, phone, role, designation, is_active, avatar_url, last_login_at, created_at';

    let query = supabaseAdmin
      .from('users')
      .select(fields)
      .eq('tenant_id', tenantId)
      .order('name');

    if (actorRole === 'admin') {
      query = query.neq('role', 'super_admin');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
    if (actor.role === 'admin' && role === 'super_admin') {
      throw new Error('Cannot assign super_admin role');
    }

    // 1. Seat Enforcement (Centralized)
    const billing = new BillingService({ tenantId: actor.tenantId, supabase: supabaseAdmin });
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

    // 3. Database Sync
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        tenant_id: actor.tenantId,
        email,
        name,
        phone: phone || null,
        role,
        designation: designation || null,
        features_override: role === 'staff' ? [] : null,
        network_access: role === 'admin'
      })
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

  /**
   * Modify user attributes
   */
  async updateUser(actor, userId, updates) {
    const patch = { ...updates };
    delete patch.id;
    delete patch.tenant_id;

    if (actor.role === 'admin' && patch.role === 'super_admin') {
      throw new Error('Cannot assign super_admin role');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(patch)
      .eq('id', userId)
      .eq('tenant_id', actor.tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return data;
  }

  /**
   * Manage granular feature visibility overrides
   */
  async manageFeatures(actor, userId, features) {
    if (actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Admin permissions required');
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
    if (actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Admin permissions required');
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
}

export default new UserService();
