import { supabaseAdmin } from '../../../providers/database/supabase.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * enforceSubscription Middleware
 * 
 * The ultimate security gate for Intravos.
 * Checks:
 * 1. is_active (Deactivation Kill-switch)
 * 2. is_free (Special override)
 * 3. subscription_end_date (Official expiry)
 * 4. grace_until (Manual extension)
 */
export const enforceSubscription = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next(); // Not a tenant-scoped request (e.g. Super Admin)

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, is_active, is_free, subscription_end_date, grace_until, deactivated_at')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return response.error(res, 'Agency context not found. Access denied.', 403);
    }

    // 1. Kill-switch check
    if (!tenant.is_active) {
      let msg = 'This agency account has been deactivated.';
      
      // Industrial refinement: Data retention message
      if (tenant.deactivated_at) {
        const deactiveDate = new Date(tenant.deactivated_at);
        const purgeDate = new Date(deactiveDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        msg += ` Your data is held for 90 days (until ${purgeDate.toLocaleDateString()}). Please contact support to reactivate.`;
      }
      
      return response.error(res, msg, 403);
    }

    // 2. Free override
    if (tenant.is_free) return next();

    // 3. Expiry check (Double check: Now < End OR Now < Grace)
    const now = new Date();
    const expiryDate = tenant.subscription_end_date ? new Date(tenant.subscription_end_date) : null;
    const graceDate = tenant.grace_until ? new Date(tenant.grace_until) : null;

    const isSubscribed = expiryDate && now < expiryDate;
    const isInGrace = graceDate && now < graceDate;

    if (!isSubscribed && !isInGrace) {
      return response.error(res, 'Your subscription has expired. Please upgrade or contact admin for a grace period.', 403);
    }

    // All clear
    next();
  } catch (err) {
    console.error('[Middleware] Subscription enforcement error:', err);
    next(); // Fail open in production for stability? 
            // Better to fail closed for commerce: return response.error(res, 'Security check failed', 500);
  }
};
