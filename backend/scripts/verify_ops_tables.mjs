
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  'bookings', 
  'booking_services', 
  'itineraries', 
  'itinerary_days',
  'itinerary_items', 
  'cancellations', 
  'group_booking_members',
  'vouchers', 
  'documents', 
  'miscellaneous_services'
];

async function checkTables() {
  console.log('--- Verifying Operations Tables ---');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log(`❌ Table Missing: ${table}`);
    } else {
      console.log(`✅ Table Exists: ${table}`);
    }
  }
}

checkTables().catch(console.error);
