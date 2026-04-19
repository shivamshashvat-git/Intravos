
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API_BASE = 'http://localhost:4003/api/v1';

async function verify() {
  console.log('--- Phase 0: Seeding Test Environment ---');
  
  // 1. Create Tenant
  const { data: tenant, error: tErr } = await supabaseAdmin.from('tenants').insert({
    name: 'Staging Operations Hub',
    slug: `ops-test-${Date.now()}`,
    agency_state: 'Delhi',
    features_enabled: ['bookings', 'itineraries', 'vouchers', 'crm', 'finance']
  }).select().single();
  if (tErr) throw tErr;
  const tenantId = tenant.id;
  console.log('Tenant Created:', tenantId);

  // 2. Create User
  const testEmail = `ops-tester-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const { data: { user }, error: uErr } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    app_metadata: { tenant_id: tenantId, role: 'admin' }
  });
  if (uErr) throw uErr;

  const { error: uErr2 } = await supabaseAdmin.from('users').upsert({
    auth_id: user.id,
    tenant_id: tenantId,
    email: testEmail,
    role: 'admin',
    name: 'Staging Ops Manager'
  }, { onConflict: 'auth_id' });
  if (uErr2) { console.error('Users Table Error:', uErr2); throw uErr2; }
  console.log('User Record Created in users table:', user.id);

  // 3. Login (Use Anon client for this)
  const { data: { session }, error: lErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  if (lErr) throw lErr;
  const token = session.access_token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 4. Create Prerequisites (Customer, Lead, Quote)
  const { data: customer, error: cErr } = await supabaseAdmin.from('customers').insert({
    tenant_id: tenantId,
    name: 'John Operations',
    email: `john.ops.${Date.now()}@example.com`,
    phone: '9876543210'
  }).select().single();
  if (cErr) { console.error('Customer Error:', cErr); throw cErr; }

  const { data: lead, error: ldErr } = await supabaseAdmin.from('leads').insert({
    tenant_id: tenantId,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    destination: 'Iceland Expedition'
  }).select().single();
  if (ldErr) { console.error('Lead Error:', ldErr); throw ldErr; }

  const { data: quote, error: qErr } = await supabaseAdmin.from('quotations').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    customer_id: customer.id,
    quote_number: `Q-${Date.now()}`,
    version: 1,
    status: 'accepted',
    total: 50000
  }).select().single();
  if (qErr) { console.error('Quote Error:', qErr); throw qErr; }

  console.log(`Seed Complete: Customer=${customer.id}, Lead=${lead.id}, Quote=${quote.id}`);

  // --- START VERIFICATION PIPELINE ---

  console.log('\n--- a. POST /api/v1/operations/bookings ---');
  const bookingRes = await fetch(`${API_BASE}/operations/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer_id: customer.id,
      lead_id: lead.id,
      quotation_id: quote.id,
      customer_name: customer.name,
      destination: 'Iceland',
      travel_start_date: '2026-12-01',
      travel_end_date: '2026-12-10',
      total_selling_price: 50000,
      status: 'confirmed'
    })
  });
  const bookingJson = await bookingRes.json();
  console.log('Status:', bookingRes.status, 'ID:', bookingJson.data?.booking?.id);
  const bookingId = bookingJson.data?.booking?.id;
  if (!bookingId) { console.error('Full Response:', JSON.stringify(bookingJson, null, 2)); process.exit(1); }

  console.log('\n--- b. GET /api/v1/operations/bookings ---');
  const listRes = await fetch(`${API_BASE}/operations/bookings`, { headers });
  const listJson = await listRes.json();
  console.log('Status:', listRes.status, 'Count:', listJson.data?.bookings?.length || listJson.data?.length);

  console.log('\n--- c. POST /api/v1/operations/bookings/:id/services ---');
  const serviceRes = await fetch(`${API_BASE}/operations/bookings/${bookingId}/services`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      service_type: 'hotel',
      title: 'Icelandic Spa Resort',
      service_start_date: '2026-12-01',
      cost_to_agency: 20000,
      price_to_client: 25000
    })
  });
  const serviceJson = await serviceRes.json();
  const serviceId = serviceJson.data?.service?.id;
  console.log('Status:', serviceRes.status, 'Service ID:', serviceId);
  if (!serviceId) { console.error('Service Error Response:', JSON.stringify(serviceJson, null, 2)); process.exit(1); }

  console.log('\n--- d. POST /api/v1/operations/bookings/:id/itinerary ---');
  const itiRes = await fetch(`${API_BASE}/operations/bookings/${bookingId}/itinerary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      booking_id: bookingId,
      title: 'Iceland Arctic Saga',
      start_date: '2026-12-01',
      end_date: '2026-12-10'
    })
  });
  const itiJson = await itiRes.json();
  const itineraryId = itiJson.data?.itinerary?.id;
  console.log('Status:', itiRes.status, 'Itinerary ID:', itineraryId);
  if (!itineraryId) { console.error('Itinerary Error Response:', JSON.stringify(itiJson, null, 2)); process.exit(1); }

  // Add a day
  const dayRes = await fetch(`${API_BASE}/operations/itineraries/${itineraryId}/days`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ day_number: 1, title: 'Arrival' })
  });
  const dayId = (await dayRes.json()).data.day.id;

  console.log('\n--- e. POST /api/v1/operations/itinerary-days/:id/items ---');
  const itemRes = await fetch(`${API_BASE}/operations/itineraries/itinerary-days/${dayId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ item_type: 'activity', title: 'Glacier Walk', time_val: '10:00 AM' })
  });
  const itemJson = await itemRes.json();
  console.log('Status:', itemRes.status, 'Item ID:', itemJson.data?.item?.id);

  console.log('\n--- f. PATCH /api/v1/operations/itinerary-days/:id/reorder ---');
  const reorderRes = await fetch(`${API_BASE}/operations/itineraries/itinerary-days/${dayId}/reorder`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ item_ids: [itemJson.data.item.id] })
  });
  console.log('Status:', reorderRes.status);

  console.log('\n--- g. POST /api/v1/operations/bookings/:id/cancel ---');
  const cancelRes = await fetch(`${API_BASE}/operations/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      cancellation_reason: 'Weather Warning - Arctic Storm', 
      cancellation_charge: 5000 
    })
  });
  const cancelJson = await cancelRes.json();
  console.log('Status:', cancelRes.status);
  if (cancelRes.status >= 400) { console.error('Cancel Error:', JSON.stringify(cancelJson, null, 2)); process.exit(1); }

  console.log('\n--- DB Verification (Cancellations) ---');
  const { data: cancellations } = await supabase.from('cancellations').select('*').eq('booking_id', bookingId);
  console.log('Cancellation Records Found:', cancellations?.length);

  console.log('\n--- DB Verification (Financial Audit) ---');
  const { data: audits } = await supabase.from('financial_audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('changed_at', { ascending: false })
    .limit(3);
  console.log('Recent Audit Logs Found:', audits?.length);

  console.log('\n--- h. POST /api/v1/operations/bookings/:id/group-members ---');
  const memberRes = await fetch(`${API_BASE}/operations/bookings/${bookingId}/group-members`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Anya Stark', nationality: 'Icelandic' })
  });
  const memberJson = await memberRes.json();
  const memberId = memberJson.data?.member?.id;
  console.log('Status:', memberRes.status, 'Member ID:', memberId);
  if (!memberId) { console.error('Member Error:', JSON.stringify(memberJson, null, 2)); process.exit(1); }

  console.log('\n--- i. POST /api/v1/operations/vouchers ---');
  const voucherRes = await fetch(`${API_BASE}/operations/vouchers`, {
     method: 'POST',
     headers,
     body: JSON.stringify({ 
       booking_id: bookingId, 
       service_id: serviceId, 
       service_title: 'Arctic Spa Resort Voucher',
       voucher_number: 'V-101',
       confirmation_number: 'Icelandic-Conf-777',
       valid_from: '2026-12-01',
       valid_to: '2026-12-10'
     })
  });
  const voucherJson = await voucherRes.json();
  const resVoucherId = voucherJson.data?.voucher?.id;
  console.log('Status:', voucherRes.status, 'Voucher ID:', resVoucherId);
  if (!resVoucherId) { console.error('Voucher Error Response:', JSON.stringify(voucherJson, null, 2)); process.exit(1); }

  console.log('\n--- j. GET /api/v1/operations/bookings/hub-analytics ---');
  const analyticsRes = await fetch(`${API_BASE}/operations/bookings/hub-analytics`, { headers });
  const analyticsJson = await analyticsRes.json();
  console.log('Status:', analyticsRes.status, 'JSON Result:', JSON.stringify(analyticsJson.data, null, 2));

  console.log('\n--- Cleanup ---');
  await supabase.auth.admin.deleteUser(user.id);
  console.log('Cleanup Complete.');
}

verify().catch(e => { console.error(e); process.exit(1); });
