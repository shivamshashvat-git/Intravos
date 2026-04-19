import { getPlatformSettings } from '../../domains/system/system/platformSettings.js';

/**
 * RBAC Engine 2.0 (Industrialized)
 * 
 * Transition from coarse Role-Based Access to granular Permission-Based Access.
 * This allows Intravos to scale to complex agency hierarchies.
 */

const MASTER_SUPER_ADMIN_ID = "0407a091-a675-4702-861c-8eb591eeb000";

/**
 * Permission Check Helper
 */
function hasPermission(user, module, action) {
  // 1. Platform-Tier God Mode (Platform Manager is Read-Only)
  if (user.role === 'super_admin' || user.id === MASTER_SUPER_ADMIN_ID) return true;
  if (user.role === 'ivobot') return true;
  
  if (user.role === 'platform_manager') {
    return ['read', 'view'].includes(action);
  }

  // 2. Agency Admin Power (Full access within tenant)
  if (['agency_admin', 'admin'].includes(user.role)) return true;

  // 3. Secondary Admin Power (High-level operational access)
  if (user.role === 'secondary_admin') {
    // Secondary admins can do almost everything except billing/deactivation
    const restrictedActions = ['delete_tenant', 'deactivate_agency_admin', 'change_billing'];
    if (restrictedActions.includes(action)) return false;
    return true;
  }

  // 4. Staff Tier (Granular Permission Grid)
  const permissions = user.permissions || {};
  const modulePerms = permissions[module];

  if (!modulePerms) return false;

  // Support array of actions (e.g. ['read', 'write']) or boolean (e.g. true for full access)
  if (Array.isArray(modulePerms)) {
    return modulePerms.includes(action);
  }

  return !!modulePerms;
}

/**
 * Standard Permission Middleware
 */
function requirePermission(module, action) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasPermission(req.user, module, action)) {
      return res.status(403).json({ 
        error: 'Permission Denied', 
        message: `You do not have the '${action}' permission for the '${module}' module.` 
      });
    }

    next();
  };
}

/**
 * Coarse-grained Role Middlewares (Maintained for backward compatibility)
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role level' });
    }

    next();
  };
}

function requireSuperAdmin() { return requireRole('super_admin', 'platform_manager', 'ivobot'); }

function requireAdmin() { 
  return requireRole('super_admin', 'platform_manager', 'agency_admin', 'admin'); 
}

function requireSecondary() {
  return requireRole('super_admin', 'agency_admin', 'secondary_admin', 'admin');
}

function requireStaff() { 
  return requireRole('super_admin', 'agency_admin', 'secondary_admin', 'staff', 'admin'); 
}

function requireWriteAccess(req, res, next) {
  if (req.user && req.user.role === 'platform_manager') {
    return res.status(403).json({ error: 'Read only access' });
  }
  next();
}

export { 
  hasPermission,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireSecondary,
  requireStaff,
  requireWriteAccess
};
