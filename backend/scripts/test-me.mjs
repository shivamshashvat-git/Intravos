import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bjcjynpnebsrqukreuhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqY2p5bnBuZWJzcnF1a3JldWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwNDMzNiwiZXhwIjoyMDkxNjgwMzM2fQ.LjdL7lNM6zri751qVS4GlBv7wXmccdX2ERnbLvcdTWY'
);

const AUTH_ID = '183c21de-0b2b-4742-a2f7-411cdd393bbe';
const TENANT_ID = '4daf985e-087b-44dc-9ed7-5d26d0fe87b2';

// Try both id and auth_id lookups
const r1 = await supabase.from('users').select('*').eq('id', AUTH_ID).single();
console.log('by id:', r1.data?.id, '| error:', r1.error?.message);

const r2 = await supabase.from('users').select('*').eq('auth_id', AUTH_ID).single();
console.log('by auth_id:', r2.data?.id, '| error:', r2.error?.message);

const r3 = await supabase.from('tenants').select('id, name, subscription_status, is_active').eq('id', TENANT_ID).single();
console.log('tenant:', r3.data?.name, '| status:', r3.data?.subscription_status, '| active:', r3.data?.is_active, '| error:', r3.error?.message);
