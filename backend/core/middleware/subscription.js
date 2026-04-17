import { supabaseAdmin } from '../../providers/database/supabase.js';

export async function enforceSubscription(req, res, next) {
  const tenant = req.tenant;

  if (!tenant) return next();

  if (req.isPublicSubmission || req.isPublicInteraction) return next();
  if (req.user && req.user.role === 'super_admin') return next();

  let status = tenant.subscription_status;

  if (status === 'archived') {
    return res.status(401).json({ success: false, error: 'Account archived. Contact support.' });
  }

  // Proactive check for trials/active subscriptions that have expired
  if (['trial', 'active', 'grace'].includes(status)) {
    const endDate = tenant.subscription_end_date || tenant.trial_end;
    if (endDate && new Date() > new Date(endDate)) {
      // Auto-update status to suspended in the DB
      await supabaseAdmin
        .from('tenants')
        .update({ subscription_status: 'suspended', is_active: false })
        .eq('id', tenant.id);
      
      status = 'suspended'; // Update local status for the rest of this request
    }
  }

  if (status === 'limited') {
    if (req.method.toUpperCase() !== 'GET') {
      return res.status(403).json({ success: false, error: 'Account is in limited mode. Only read access is available. Please renew your subscription.' });
    }
    return next();
  }

  if (status === 'suspended') {
    // Industrial Governance: Check for deactivation timestamp
    if (tenant.deactivated_at) {
      const deactivationDate = new Date(tenant.deactivated_at).toLocaleDateString();
      return res.status(403).json({ 
        success: false, 
        error: `Agency under deactivation. Data will be retained for 90 days from ${deactivationDate}. Contact Super Admin for restoration.` 
      });
    }

    if (req.method.toUpperCase() === 'GET') {
      return next();
    } else {
      return res.status(403).json({ success: false, error: 'Account suspended. Apply coupon to activate.' });
    }
  }

  // Final check: Grace Period override
  if (tenant.grace_until && new Date() < new Date(tenant.grace_until)) {
    return next();
  }

  return next();
}
