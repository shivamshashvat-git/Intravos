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
  // 1. God Mode Override
  if (user.role === 'super_admin' || user.id === MASTER_SUPER_ADMIN_ID) return true;

  // 2. Admin Default (Admins have full access within their tenant by default)
  if (user.role === 'admin') return true;

  // 3. Platform Manager Logic (Read-only System Core)
  if (user.role === 'platform_manager') {
    if (['read', 'view'].includes(action)) return true;
    return false; // mutations blocked in core
  }

  // 4. Granular Permission Grid Check
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

function requireSuperAdmin() { return requireRole('super_admin'); }
function requireAdmin() { return requireRole('super_admin', 'admin'); }
function requireStaff() { return requireRole('super_admin', 'admin', 'staff'); }

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
  requireStaff,
  requireWriteAccess
};
