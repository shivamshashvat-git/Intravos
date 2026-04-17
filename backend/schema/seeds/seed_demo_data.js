import demoService from '../utils/demoService.js';
import { supabaseAdmin } from '../lib/supabase.js';

async function seed() {
  const hqTenantId = '00000000-0000-0000-0000-000000000000';
  
  // Verify HQ tenant exists
  const { data: tenant, error } = await supabaseAdmin.from('tenants').select('id, is_demo').eq('id', hqTenantId).single();
  
  if (error || !tenant) {
    console.error('❌ HQ Tenant not found. Please ensure you have run the INSERT INTO tenants snippet from Step 6 of the Setup Guide.');
    process.exit(1);
  }

  console.log(`Seeding Demo Golden Portfolio for HQ Tenant: ${hqTenantId}...`);
  
  try {
    await demoService.seedDemoData(hqTenantId);
    console.log('✅ Demo data seeding complete! You can now explore the dashboards.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
    process.exit(1);
  }
}

seed();
