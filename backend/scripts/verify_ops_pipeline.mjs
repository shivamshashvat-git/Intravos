
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tenantId = '2e5682b9-861e-4c70-a534-47b8ba684f1a';
const userId = '11223344-5566-7788-9900-aabbccddeeff'; // Mock user id for script
const customerId = '639c0692-0402-4523-be12-25916fe8d363'; // Mock customer from setup or previous
const quotationId = '8fb9da2a-619f-4f7e-94e6-bef3a3351ccc'; // Mock quote from previous verification

async function verifyBookingPipeline() {
  console.log('--- Phase 3a: Booking CRUD ---');
  
  // 1. Create Booking
  const { data: booking, error: createErr } = await supabase.from('bookings').insert({
    tenant_id: tenantId,
    customer_id: customerId,
    quotation_id: quotationId,
    customer_name: 'Verification Hub',
    destination: 'Maldives',
    booking_ref: `BK-V${Date.now()}`,
    status: 'enquiry',
    created_by: userId
  }).select().single();

  if (createErr) {
    console.error('❌ Create Booking Failed:', createErr);
    return;
  }
  console.log('✅ Booking Created:', booking.id, 'Status:', booking.status);

  // 2. Update Status (Transition)
  const { error: patchErr } = await supabase.from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', booking.id);
  
  if (patchErr) {
    console.error('❌ Update Status Failed:', patchErr);
  } else {
    console.log('✅ Status Updated to confirmed');
  }

  console.log('--- Phase 3b: Booking Services ---');
  // 3. Add Service
  const { data: service, error: serviceErr } = await supabase.from('booking_services').insert({
    tenant_id: tenantId,
    booking_id: booking.id,
    service_type: 'hotel',
    title: 'Soneva Fushi',
    cost_to_agency: 150000,
    price_to_client: 180000
  }).select().single();

  if (serviceErr) {
    console.error('❌ Add Service Failed:', serviceErr);
  } else {
    console.log('✅ Service Added:', service.id, 'Cost:', service.cost_to_agency);
  }

  // 4. Cleanup (Soft Delete)
  const { error: delErr } = await supabase.from('bookings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', booking.id);
  
  if (delErr) {
    console.error('❌ Soft Delete Failed:', delErr);
  } else {
    console.log('✅ Booking Soft Deleted');
  }
}

verifyBookingPipeline().catch(console.error);
