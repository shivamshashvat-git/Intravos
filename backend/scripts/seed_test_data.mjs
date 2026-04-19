import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000004';
  
  console.log('Seeding test tenant...');
  const { error: tErr } = await supabase.from('tenants').upsert({
    id: testTenantId,
    name: 'Acme Travels',
    slug: 'acme-travels',
    is_active: true
  });
  if (tErr) console.error('Tenant Seed Error:', tErr);

  console.log('Seeding test user...');
  const { error: uErr } = await supabase.from('users').upsert({
    id: testUserId,
    auth_id: testUserId,
    tenant_id: testTenantId,
    email: 'agent1@acme.com',
    name: 'Agent 1',
    role: 'staff',
    is_active: true
  });
  if (uErr) console.error('User Seed Error:', uErr);

  console.log('Seed complete.');
}

seed();
