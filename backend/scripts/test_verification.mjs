import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API_URL = 'http://localhost:4003/api/v1';

async function runTests() {
  console.log('--- STARTING VERIFICATION ---');

  // 1. Get Admin JWT
  const TEST_PASSWORD = 'TestPassword123!';
  const { data: adminUser, error: adminErr } = await supabase.auth.admin.updateUserById(
    '183c21de-0b2b-4742-a2f7-411cdd393bbe',
    { password: TEST_PASSWORD }
  );
  if (adminErr) throw adminErr;
  
  const { data: adminSession, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'shivam@intravos.com',
    password: TEST_PASSWORD
  });
  if (loginErr) throw loginErr;
  const adminToken = adminSession.session.access_token;
  const tenantId = '2e5682b9-861e-4c70-a534-47b8ba684f1a';

  console.log('✅ Admin Token Acquired');

  // 2. Create Staff User
  const staffEmail = `staff_${Date.now()}@test.com`;
  const { data: staffUser, error: staffCreateErr } = await supabase.auth.admin.createUser({
    email: staffEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'staff', tenant_id: tenantId },
    app_metadata: { role: 'staff', tenant_id: tenantId }
  });
  if (staffCreateErr) throw staffCreateErr;

  await supabase.from('users').upsert({
    id: staffUser.user.id,
    email: staffEmail,
    role: 'staff',
    tenant_id: tenantId
  });

  const { data: staffSession } = await supabase.auth.signInWithPassword({
    email: staffEmail,
    password: TEST_PASSWORD
  });
  const staffToken = staffSession.session.access_token;
  console.log('✅ Staff User Created & Token Acquired');

  // 3. Create a Quotation (using service to ensure correct structure)
  const leadId = '98a4e1f8-b487-4ba7-9052-493c27d4bd7d';
  console.log('\n--- CREATING TEST QUOTATION ---');
  const createRes = await fetch(`${API_URL}/finance/quotations`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lead_id: leadId,
      items: [
        { description: 'Hotel Stay', amount: 10000, gst_rate: 18, cost_price: 8000 },
        { description: 'Transport', amount: 5000, gst_rate: 5, cost_price: 4000 }
      ]
    })
  });
  if (!createRes.ok) throw new Error('Failed to create test quotation: ' + await createRes.text());
  const { data: { quotation: createdQuote } } = await createRes.json();
  console.log(`✅ Created Quote: ${createdQuote.quote_number} (ID: ${createdQuote.id})`);

  // 4. Issue 3: Financial Blinder Test
  console.log('\n--- ISSUE 3: Financial Blinder Test ---');
  
  const quoteResAdmin = await fetch(`${API_URL}/finance/quotations`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const quoteDataAdmin = await quoteResAdmin.json();
  const quotesAdmin = quoteDataAdmin.data.quotations || quoteDataAdmin.data;
  const firstQuote = quotesAdmin.find(q => q.id === createdQuote.id);
  
  console.log('Admin Response Fields:', Object.keys(firstQuote));
  const hasBlindFieldsAdmin = ['total_cost_price', 'total_margin'].every(f => Object.keys(firstQuote).includes(f));
  console.log('Admin see cost/margin?', hasBlindFieldsAdmin);

  const quoteResStaff = await fetch(`${API_URL}/finance/quotations`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const quoteDataStaff = await quoteResStaff.json();
  const quotesStaff = quoteDataStaff.data.quotations || quoteDataStaff.data;
  const firstQuoteStaff = quotesStaff.find(q => q.id === createdQuote.id);
  
  console.log('Staff Response Fields:', Object.keys(firstQuoteStaff));
  const hasBlindFieldsStaff = ['total_cost_price', 'total_margin', 'margin'].some(f => Object.keys(firstQuoteStaff).includes(f));
  console.log('Staff see cost/margin?', hasBlindFieldsStaff);

  // 5. Issue 4: Audit Log Verification
  console.log('\n--- ISSUE 4: Audit Log Verification ---');
  
  const quoteId = createdQuote.id;
  const oldTotal = createdQuote.total;
  
  // Update via PATCH
  const items = [
    { description: 'Premium Hotel', amount: 15000, gst_rate: 18, cost_price: 12000 },
    { description: 'Transport', amount: 5000, gst_rate: 5, cost_price: 4000 }
  ];

  const patchRes = await fetch(`${API_URL}/finance/quotations/${quoteId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });
  
  if (!patchRes.ok) console.error('Patch failed:', await patchRes.text());
  else console.log('✅ Quotation Patched Successfully');

  // Check Audit Log
  const { data: auditLogs, error: auditErr } = await supabase
    .from('financial_audit_log')
    .select('entity_type, entity_id, field_changed, old_value, new_value, changed_at')
    .eq('tenant_id', tenantId)
    .order('changed_at', { ascending: false })
    .limit(5);

  if (auditErr) console.error('Audit Log Fetch Error:', auditErr);
  else {
    console.log('Recent Audit Logs:');
    console.table(auditLogs);
  }

  // Cleanup
  await supabase.auth.admin.deleteUser(staffUser.user.id);
  await supabase.from('users').delete().eq('id', staffUser.user.id);
  console.log('\n✅ Verification Script Completed');
}

runTests().catch(console.error);
