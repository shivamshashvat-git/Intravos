require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEMO_ACCOUNTS = [
  { email: "super@intravos.dev", password: "password123", role: "super_admin", name: "Super Admin Sandbox" },
  { email: "owner@intravos.dev", password: "password123", role: "admin", name: "Agency Owner Sandbox" },
  { email: "staff@intravos.dev", password: "password123", role: "staff", name: "Agent Staff Sandbox" }
];

async function seed() {
  console.log("Checking Supabase connection...");
  
  // 1. Get an existing Demo Tenant
  let { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name').limit(1);
  if (tErr || !tenants || tenants.length === 0) {
    console.error("No tenants found in your database. Please create a tenant row in Supabase first.");
    return;
  }
  const tenant = tenants[0];
  console.log(`Using existing Tenant: ${tenant.name} (ID: ${tenant.id})`);

  for (const acc of DEMO_ACCOUNTS) {
    console.log(`Processing ${acc.email}...`);
    // Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true
    });

    if (authErr && !authErr.message.toLowerCase().includes("already")) {
      console.error("Auth creation failed:", authErr.message);
      // don't continue, we might still need to link DB profile
    }

    // Get Auth ID if already exists
    let authUser = authData?.user;
    if (!authUser) {
      const { data: existing } = await supabase.auth.admin.listUsers();
      authUser = existing.users.find(u => u.email === acc.email);
    }

    if (authUser) {
      // Upsert into users table
      const { error: dbErr } = await supabase.from('users').upsert({
        id: authUser.id,
        email: acc.email,
        name: acc.name,
        role: acc.role,
        tenant_id: tenant.id
      });
      if (dbErr) console.error("User DB profile failed:", dbErr.message);
      else {
        // Essential: Update app_metadata so backend middleware approves the JWT token
        await supabase.auth.admin.updateUserById(authUser.id, {
          app_metadata: { tenant_id: tenant.id, role: acc.role }
        });
        console.log(`✓ Seeded ${acc.email} (${acc.role})`);
      }
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log("--- TEST CREDENTIALS ---");
  for (const acc of DEMO_ACCOUNTS) {
    console.log(`${acc.role.toUpperCase().padEnd(12)} -> Email: ${acc.email}  |  Password: ${acc.password}`);
  }
}

seed().catch(console.error);
