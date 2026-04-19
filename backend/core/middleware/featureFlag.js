// Check if a feature is enabled for the tenant
export function requireFeature(featureName) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(403).json({ error: 'No tenant context' });
    }

    // Super admin bypasses feature flags
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    const locked = req.tenant.features_locked || [];

    if (locked.includes(featureName)) {
      return res.status(403).json({
        error: 'Feature locked',
        message: 'This feature requires an upgrade. Contact us to unlock.',
        code: 'FEATURE_LOCKED',
        feature: featureName,
      });
    }

    // Per-user feature scoping:
    // If user has features_override set (staff with restricted access), use it.
    // Admin role inherits tenant-level features. Staff with NULL override also inherits.
    const adminRoles = ['admin', 'agency_admin', 'secondary_admin'];
    const userOverride = req.user?.features_override;
    const effectiveFeatures = (adminRoles.includes(req.user?.role) || !userOverride)
      ? (req.tenant.features_enabled || [])
      : userOverride;

    if (!effectiveFeatures.includes(featureName)) {
      return res.status(403).json({
        error: 'Feature not available',
        code: 'FEATURE_DISABLED',
        feature: featureName,
      });
    }

    next();
  };
}

export function requireVisibleFeature(featureName) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(403).json({ error: 'No tenant context' });
    }

    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    // Per-user override takes priority for visibility too
    const adminRoles = ['admin', 'agency_admin', 'secondary_admin'];
    const userOverride = req.user?.features_override;
    const effectiveVisible = (adminRoles.includes(req.user?.role) || !userOverride)
      ? (req.tenant.features_visible || [])
      : userOverride;

    if (!effectiveVisible.includes(featureName)) {
      return res.status(403).json({
        error: 'Feature hidden',
        code: 'FEATURE_HIDDEN',
        feature: featureName,
      });
    }

    next();
  };
}

/**
 * Returns the effective feature list for a user.
 * Used by auth response to tell frontend which sidebar items to show.
 */
export function getEffectiveFeatures(user, tenant) {
  if (user.role === 'super_admin') {
    return tenant.features_enabled || [];
  }
  const adminRoles = ['admin', 'agency_admin', 'secondary_admin'];
  if (adminRoles.includes(user.role)) {
    return tenant.features_enabled || [];
  }
  // Staff: use override if set, else tenant defaults
  if (user.features_override && Array.isArray(user.features_override)) {
    return user.features_override;
  }
  return tenant.features_enabled || [];
}
