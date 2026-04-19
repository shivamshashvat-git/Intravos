import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bjcjynpnebsrqukreuhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqY2p5bnBuZWJzcnF1a3JldWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwNDMzNiwiZXhwIjoyMDkxNjgwMzM2fQ.LjdL7lNM6zri751qVS4GlBv7wXmccdX2ERnbLvcdTWY'
);

// Find user
const { data: { users } } = await supabase.auth.admin.listUsers();
const user = users.find(u => u.email === 'shivam@intravos.com');
console.log('Auth user ID:', user?.id);
console.log('Current app_metadata:', JSON.stringify(user?.app_metadata));

// Find DB profile
const { data: profile, error } = await supabase
  .from('users')
  .select('id, tenant_id, role, is_active')
  .eq('auth_id', user.id)
  .single();

console.log('DB profile:', JSON.stringify(profile));
console.log('DB error:', error?.message);
