import { supabaseAdmin  } from '../../../providers/database/supabase.js';

function computeHealth(lastLoginAt, leadsThisWeek, actionsThisWeek) {
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
  const health = computeHealth(lastLoginAt, leadsThisWeek || 0, actionsThisWeek || 0);

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

export { refreshClientHealth  };
