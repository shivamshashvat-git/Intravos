function countActions(rows) {
  return rows.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});
}

async function runFallbackLifecycle(supabaseAdmin) {
  const now = new Date().toISOString();
  const transitions = [];

  async function transition(query, rpcName, action) {
    const { data: tenants, error } = await query;
    if (error) throw error;

    for (const tenant of tenants || []) {
      const { error: rpcError } = await supabaseAdmin.rpc(rpcName, { p_tenant_id: tenant.id });
      if (rpcError) throw rpcError;
      transitions.push({ tenant_id: tenant.id, action });
    }
  }

  await transition(
    supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('is_free', true)
      .not('free_until', 'is', null)
      .lte('free_until', now),
    'expire_free_access',
    'free_expired'
  );

  await transition(
    supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subscription_status', 'trial')
      .eq('is_free', false)
      .lte('subscription_end_date', now),
    'transition_to_grace',
    'trial_to_grace'
  );

  await transition(
    supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subscription_status', 'active')
      .eq('is_free', false)
      .lte('subscription_end_date', now),
    'transition_to_grace',
    'active_to_grace'
  );

  await transition(
    supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subscription_status', 'grace')
      .lte('grace_until', now),
    'transition_to_limited',
    'grace_to_limited'
  );

  await transition(
    supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subscription_status', 'limited')
      .lte('limited_until', now),
    'transition_to_suspended',
    'limited_to_suspended'
  );

  return {
    processed: transitions.length,
    actions: countActions(transitions),
    transitions,
    mode: 'fallback',
  };
}

async function runSubscriptionLifecycle(supabaseAdmin) {
  try {
    const { data, error } = await supabaseAdmin.rpc('process_subscription_lifecycle');
    if (error) throw error;

    const transitions = Array.isArray(data) ? data : [];
    return {
      processed: transitions.length,
      actions: countActions(transitions),
      transitions,
      mode: 'rpc',
    };
  } catch (error) {
    console.error('Subscription lifecycle RPC failed, falling back:', error.message || error);
    return runFallbackLifecycle(supabaseAdmin);
  }
}

export { runSubscriptionLifecycle  };
