import { supabaseAdmin, supabaseForUser } from '../../providers/database/supabase.js';
import logger from '../utils/logger.js';
import { enforceSubscription  } from './subscription.js';
import config from '../config/index.js';

async function resolveImpersonation(req, actorUser, accessToken) {
  const sessionToken = req.headers['x-impersonation-token'];
  if (!sessionToken || actorUser.role !== 'super_admin') {
    return null;
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('impersonation_sessions')
    .select('id, session_token, target_user_id, target_tenant_id, status, metadata')
    .eq('session_token', sessionToken)
    .eq('status', 'active')
    .single();

  if (sessionError || !session) {
    return null;
  }

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, tenant_id, is_active')
    .eq('id', session.target_user_id)
    .eq('tenant_id', session.target_tenant_id)
    .single();

  if (targetError || !targetUser || targetUser.is_active === false) {
    return null;
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, name, slug, plan, trial_end, is_active, features_enabled, subscription_status, subscription_start_date, subscription_end_date, grace_until, limited_until, deactivated_at, is_free, annual_price, is_early_client')
    .eq('id', session.target_tenant_id)
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  await supabaseAdmin
    .from('impersonation_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    session,
    tenant,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      tenantId: targetUser.tenant_id,
      role: targetUser.role,
    },
    accessToken,
  };
}

// Verify JWT and attach user context to request
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const appMeta = user.app_metadata || {};
    const tenantId = appMeta.tenant_id;
    const role = appMeta.role;

    if (!tenantId || !role) {
      return res.status(403).json({ error: 'User not configured — missing tenant or role' });
    }

    // Check if tenant is active and not expired trial
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, plan, trial_end, is_active, features_enabled, subscription_status, subscription_start_date, subscription_end_date, grace_until, limited_until, deactivated_at, is_free, annual_price, is_early_client')
      .eq('id', tenantId)
      .single();

    if (tenantErr || !tenant) {
      return res.status(403).json({ error: 'Tenant not found' });
    }

    // Fetch extended user profile for feature scoping & designation
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('designation, features_override, network_access')
      .eq('id', user.id)
      .single();

    const actorUser = {
      id: user.id,
      email: user.email,
      tenantId,
      role,
      designation: userProfile?.designation || null,
      features_override: userProfile?.features_override || null,
      network_access: userProfile?.network_access || false,
    };
    req.actor = actorUser;
    req.user = actorUser;
    req.tenant = tenant;
    req.accessToken = token;
    req.supabase = supabaseForUser(token);

    const impersonation = await resolveImpersonation(req, actorUser, token);
    if (impersonation) {
      req.impersonator = actorUser;
      req.user = impersonation.user;
      req.tenant = impersonation.tenant;
      req.impersonation = {
        id: impersonation.session.id,
        token: impersonation.session.session_token,
        metadata: impersonation.session.metadata || {},
      };

      // PLATFORM SAFETY: Block mutations if not in Edit Mode
      const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (isMutation && !req.impersonation.metadata.is_edit_mode) {
        return res.status(403).json({ 
          error: 'View Only Mode', 
          message: 'You are in View Only mode. Switch to Edit Mode in the top header to make changes.' 
        });
      }
    }

    // Update last login
    supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', actorUser.id)
      .then(() => {});

    // Subscription enforcement runs here — req.tenant is now set
    return enforceSubscription(req, res, next);
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Authenticate using tenant API key (for public website submissions & Lead Ingestion)
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  try {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, plan, is_active, features_enabled')
      .eq('api_key', apiKey)
      .single();

    if (error || !tenant) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    if (!tenant.is_active) {
      return res.status(403).json({ error: 'Tenant account is inactive' });
    }

    // Standardize tenant info for controllers
    req.tenant = tenant;
    req.tenantId = tenant.id; 
    req.isPublicSubmission = true;

    next();
  } catch (err) {
    logger.error('API key auth error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export { authenticate, authenticateApiKey  };
