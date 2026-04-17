import { supabaseAdmin } from '../lib/supabase.js';

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Super Admin';

if (!email || !password) {
  console.error('Usage: node scripts/init-super-admin.js <email> <password> ["Name"]');
  process.exit(1);
}

async function initSuperAdmin() {
  console.log(`Creating super admin: ${email}`);

  const hqTenantId = '00000000-0000-0000-0000-000000000000';

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      tenant_id: hqTenantId,
      role: 'super_admin',
    },
  });

  if (authError) {
    // If user already exists, update their app_metadata instead
    if (authError.message.toLowerCase().includes('already')) {
      console.log('User already exists in auth. Updating app_metadata...');
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      const user = existing.users.find(u => u.email === email);
      if (user) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: { tenant_id: hqTenantId, role: 'super_admin' },
        });
        console.log(`✅ Updated app_metadata for existing user ${email}`);
      }
    } else {
      console.error('Auth Error:', authError.message);
      process.exit(1);
    }
  }

  // Get the auth user ID
  let userId;
  if (authData?.user) {
    userId = authData.user.id;
    // Set app_metadata for newly created user
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: hqTenantId, role: 'super_admin' },
    });
  } else {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const user = existing.users.find(u => u.email === email);
    userId = user?.id;
  }

  if (!userId) {
    console.error('Failed to resolve user ID.');
    process.exit(1);
  }

  // Upsert profile in users table
  const { error: profileError } = await supabaseAdmin.from('users').upsert({
    id: userId,
    tenant_id: hqTenantId,
    email: email,
    name: name,
    role: 'super_admin',
    is_active: true
  });

  if (profileError) {
    console.error('Profile Error:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Super Admin created successfully!');
  console.log(`   User ID: ${userId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Tenant: Intravos HQ (${hqTenantId})`);
  console.log(`   Role: super_admin`);
  process.exit(0);
}

initSuperAdmin();
