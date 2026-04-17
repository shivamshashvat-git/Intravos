require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function activate() {
  const { data: tenants } = await supabase.from('tenants').select('id, name, subscription_status').limit(5);
  console.log("Tenants found:", JSON.stringify(tenants, null, 2));

  const tenantId = "781a2652-536e-49fc-b885-9a2c64cc222a";

  // Set subscription_end_date 1 year from now, activate as active
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const { error } = await supabase.from('tenants')
    .update({
      subscription_status: 'active',
      is_active: true,
      plan: 'growth',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: oneYearFromNow.toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error("Failed to activate tenant:", error.message);
  } else {
    console.log(`✅ Tenant activated with 'active' status until ${oneYearFromNow.toDateString()}`);
  }
}

activate().catch(console.error);
