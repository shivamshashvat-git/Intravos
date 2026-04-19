
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifySchema() {
  console.log('--- Verifying Visa Schema ---');

  // Check columns for visa_tracking
  const { error: vtErr } = await supabase.from('visa_tracking').select('booking_id').limit(1);
  console.log('visa_tracking booking_id check:', vtErr ? 'Missing (' + vtErr.message + ')' : 'Present');

  // Check columns for visa_documents
  const { error: vdErr } = await supabase.from('visa_documents').select('visa_id, document_type, verified, file_name, uploaded_by, verified_by, verified_at').limit(1);
  console.log('visa_documents columns check:', vdErr ? 'Error (' + vdErr.message + ')' : 'Correct columns present');
}

verifySchema();
