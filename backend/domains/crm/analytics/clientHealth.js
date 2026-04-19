import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * Tenant Health Scoring (Agency Level)
 */
function computeTenantHealth(lastLoginAt, leadsThisWeek, actionsThisWeek) {
  if (!lastLoginAt) return 'red';

  const lastLogin = new Date(lastLoginAt);
  const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / 86400000);

  if (daysSinceLogin > 21) return 'red';
  if (daysSinceLogin > 7 || (leadsThisWeek === 0 && actionsThisWeek < 2)) return 'yellow';
  return 'green';
}

async function refreshClientHealth(tenantId) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('last_login_at')
    .eq('tenant_id', tenantId)
    .order('last_login_at', { ascending: false })
    .limit(1);

  const { count: leadsThisWeek = 0 } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo);

  const { count: paymentsThisWeek = 0 } = await supabaseAdmin
    .from('payment_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo);

  const { count: quotationsThisWeek = 0 } = await supabaseAdmin
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', weekAgo);

  const lastLoginAt = users?.[0]?.last_login_at || null;
  const actionsThisWeek = (paymentsThisWeek || 0) + (quotationsThisWeek || 0) + (leadsThisWeek || 0);
  const health = computeTenantHealth(lastLoginAt, leadsThisWeek || 0, actionsThisWeek || 0);

  const payload = {
    tenant_id: tenantId,
    health,
    last_login: lastLoginAt,
    leads_this_week: leadsThisWeek || 0,
    actions_this_week: actionsThisWeek || 0,
    calculated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('client_health')
    .upsert(payload, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Individual Customer Health Scoring
 */
async function refreshCustomerHealth(tenantId, customerId) {
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('total_bookings, last_booking_at, last_contacted_at')
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .single();

  if (!customer) return null;

  let score = 50; 
  if (customer.last_booking_at) {
    const months = (Date.now() - new Date(customer.last_booking_at).getTime()) / (1000 * 3600 * 24 * 30);
    if (months <= 6) score += 30;
    else if (months <= 12) score += 10;
    else score -= 10;
  }
  if (customer.last_contacted_at) {
    const months = (Date.now() - new Date(customer.last_contacted_at).getTime()) / (1000 * 3600 * 24 * 30);
    if (months > 3) score -= 15;
  }
  if ((customer.total_bookings || 0) > 3) score += 20;

  score = Math.max(0, Math.min(100, score));

  const { data, error } = await supabaseAdmin
    .from('customer_health_cache')
    .upsert({
      customer_id: customerId,
      tenant_id: tenantId,
      health_score: score,
      updated_at: new Date().toISOString()
    }, { onConflict: 'customer_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export { refreshClientHealth, refreshCustomerHealth };
